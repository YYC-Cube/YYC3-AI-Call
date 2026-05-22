import prisma from '@/lib/db';

interface BatchLoadOptions<T> {
  ids: string[];
  batchSize?: number;
  select?: Record<string, unknown>;
  include?: Record<string, unknown>;
}

export class QueryOptimizer {
  private static readonly DEFAULT_BATCH_SIZE = 50;

  static async batchLoad<T>(
    model: keyof typeof prisma,
    options: BatchLoadOptions<T>
  ): Promise<Map<string, T>> {
    const { ids, batchSize = this.DEFAULT_BATCH_SIZE, select, include } = options;

    if (ids.length === 0) return new Map();

    const result = new Map<string, T>();

    for (let i = 0; i < ids.length; i += batchSize) {
      const batchIds = ids.slice(i, i + batchSize);

      const records = await (prisma[model] as any).findMany({
        where: {
          id: { in: batchIds },
        },
        ...(select && { select }),
        ...(include && { include }),
      });

      records.forEach((record: T & { id: string }) => {
        result.set(record.id, record);
      });
    }

    return result;
  }

  static async loadWithRelations<
    T extends { id: string },
    R extends Record<string, any[]>
  >(
    items: T[],
    relationLoaders: Array<{
      key: string;
      loader: (ids: string[]) => Promise<Map<string, any>>;
    }>
  ): Promise<(T & R)[]> {
    if (items.length === 0) return [];

    const allIds = items.map((item) => item.id);

    const relationMaps = await Promise.all(
      relationLoaders.map(async ({ loader }) => loader(allIds))
    );

    return items.map((item, index) => {
      const enrichedItem = { ...item };

      relationLoaders.forEach(({ key }, relationIndex) => {
        const relationMap = relationMaps[relationIndex];
        (enrichedItem as any)[key] = relationMap.get(item.id) || [];
      });

      return enrichedItem as T & R;
    });
  }

  static buildWhereClause(filters: Record<string, unknown>): Record<string, unknown> {
    const where: Record<string, unknown> = {};

    for (const [key, value] of Object.entries(filters)) {
      if (!value || (typeof value === 'string' && value.trim() === '')) continue;

      if (typeof value === 'object' && !Array.isArray(value)) {
        where[key] = value;
      } else if (Array.isArray(value) && value.length > 0) {
        where[key] = { in: value };
      } else if (typeof value === 'string') {
        if (value.includes('*')) {
          where[key] = {
            contains: value.replace(/\*/g, ''),
            mode: 'insensitive',
          };
        } else {
          where[key] = {
            contains: value,
            mode: 'insensitive',
          };
        }
      } else {
        where[key] = value;
      }
    }

    return where;
  }

  static createPaginationOptions(page: number, pageSize: number) {
    const validPage = Math.max(1, page);
    const validPageSize = Math.min(Math.max(1, pageSize), 100);
    const skip = (validPage - 1) * validPageSize;

    return {
      skip,
      take: validPageSize,
      page: validPage,
      pageSize: validPageSize,
    };
  }

  static formatPaginationResponse<T>(
    items: T[],
    total: number,
    page: number,
    pageSize: number
  ) {
    return {
      data: items,
      pagination: {
        page,
        pageSize,
        total,
        totalPages: Math.ceil(total / pageSize),
        hasNext: page * pageSize < total,
        hasPrev: page > 1,
      },
    };
  }
}

export async function getCustomersWithBatchLoading(options: {
  page?: number;
  pageSize?: number;
  search?: string;
  status?: string;
  tenantId?: string;
}) {
  const { page = 1, pageSize = 20, search, status, tenantId } = options;

  const pagination = QueryOptimizer.createPaginationOptions(page, pageSize);

  const where: Record<string, unknown> = {};

  if (tenantId) {
    where.tenantId = tenantId;
  }

  if (status) {
    where.status = status;
  }

  if (search) {
    where.OR = [
      { name: { contains: search, mode: 'insensitive' as const } },
      { phone: { contains: search } },
      { company: { contains: search, mode: 'insensitive' as const } },
      { email: { contains: search, mode: 'insensitive' as const } },
    ];
  }

  const [customers, total] = await Promise.all([
    prisma.customer.findMany({
      where,
      include: {
        assignments: {
          select: {
            id: true,
            name: true,
            avatar: true,
          },
        },
        _count: {
          select: { calls: true, interactions: true },
        },
      },
      skip: pagination.skip,
      take: pagination.take,
      orderBy: { updatedAt: 'desc' },
    }),
    prisma.customer.count({ where }),
  ]);

  return QueryOptimizer.formatPaginationResponse(customers, total, pagination.page, pagination.pageSize);
}
