import { NextRequest, NextResponse } from 'next/server';

export const API_VERSIONS = {
  V1: {
    version: 'v1',
    path: '/api/v1',
    status: 'current' as const,
    deprecated: false,
    sunsetDate: null as string | null,
    supportedUntil: '2027-12-31',
  },
  V2: {
    version: 'v2',
    path: '/api/v2',
    status: 'beta' as const,
    deprecated: false,
    sunsetDate: null as string | null,
    supportedUntil: '2028-12-31',
  },
} as const;

type APIVersion = keyof typeof API_VERSIONS;

interface VersionInfo {
  version: string;
  path: string;
  status: 'current' | 'deprecated' | 'beta' | 'sunset';
  deprecated: boolean;
  sunsetDate: string | null;
  supportedUntil: string;
}

class APIVersionManager {
  private static instance: APIVersionManager;

  private constructor() {}

  static getInstance(): APIVersionManager {
    if (!APIVersionManager.instance) {
      APIVersionManager.instance = new APIVersionManager();
    }
    return APIVersionManager.instance;
  }

  getVersionFromPath(pathname: string): APIVersion | null {
    if (pathname.startsWith('/api/v2/')) return 'V2';
    if (pathname.startsWith('/api/v1/') || pathname.startsWith('/api/')) return 'V1';
    return null;
  }

  getVersionInfo(version: APIVersion): VersionInfo {
    return { ...API_VERSIONS[version] };
  }

  isVersionDeprecated(version: APIVersion): boolean {
    return API_VERSIONS[version].deprecated;
  }

  isVersionSupported(version: APIVersion): boolean {
    const info = API_VERSIONS[version];
    if (info.deprecated) {
      if (info.sunsetDate && new Date(info.sunsetDate) < new Date()) {
        return false;
      }
    }
    return true;
  }

  getDefaultVersion(): APIVersion {
    return 'V1';
  }

  getLatestStableVersion(): APIVersion {
    return 'V1';
  }

  getAllVersions(): VersionInfo[] {
    return Object.entries(API_VERSIONS).map(([, info]) => ({ ...info }));
  }

  createVersionResponse(version: APIVersion): NextResponse {
    const info = this.getVersionInfo(version);

    const headers = new Headers({
      'Content-Type': 'application/json',
      'X-API-Version': info.version,
      'X-API-Status': info.status,
      ...(info.supportedUntil && {
        'X-API-Supported-Until': info.supportedUntil,
      }),
      ...(info.sunsetDate && { 'X-API-Sunset': info.sunsetDate }),
      ...(info.deprecated ? { Warning: `299 - "API version ${version} is deprecated"` } : {}),
    });

    return new NextResponse(null, {
      status: info.deprecated ? 200 : 200,
      headers,
    });
  }
}

export function apiVersionMiddleware(request: NextRequest): {
  version: APIVersion;
  headers: Record<string, string>;
} {
  const manager = APIVersionManager.getInstance();
  const url = new URL(request.url);
  const pathname = url.pathname;

  let version = manager.getVersionFromPath(pathname);

  if (!version) {
    version = manager.getDefaultVersion();
  }

  const versionInfo = manager.getVersionInfo(version);
  const headers: Record<string, string> = {
    'X-API-Version': versionInfo.version,
    'X-API-Status': versionInfo.status,
  };

  if (versionInfo.supportedUntil) {
    headers['X-API-Supported-Until'] = versionInfo.supportedUntil;
  }

  if (versionInfo.sunsetDate) {
    headers['X-API-Sunset'] = versionInfo.sunsetDate;
  }

  if (versionInfo.deprecated) {
    headers['Warning'] = `299 - "API version ${version} is deprecated"`;
  }

  return { version, headers };
}

export function createDeprecatedEndpointHandler(
  currentVersionUrl: string,
  deprecationMessage?: string
) {
  return (request: NextRequest): NextResponse => {
    return NextResponse.json(
      {
        success: false,
        error:
          deprecationMessage ||
          'This endpoint has been moved. Please use the updated endpoint.',
        code: 'E0008',
        migration: {
          from: request.url,
          to: currentVersionUrl,
          documentation: '/docs/api/migration-guide',
          deadline: API_VERSIONS.V1.supportedUntil,
        },
      },
      {
        status: 410,
        headers: {
          'Deprecation': 'true',
          'Sunset': new Date(API_VERSIONS.V1.supportedUntil).toDateString(),
          'Link': `<${currentVersionUrl}>; rel="successor-version"`,
        },
      }
    );
  };
}

export const apiVersionManager = APIVersionManager.getInstance();

const VERSION_ROUTING_MAP: Record<string, string> = {
  '/api/ai-family': '/api/v1/ai-family',
  '/api/customers': '/api/v1/customers',
  '/api/analytics': '/api/v1/analytics',
  '/api/tenants': '/api/v1/tenants',
  '/api/auth': '/api/v1/auth',
  '/api/multimodal': '/api/v1/multimodal',
  '/api/mcp': '/api/v1/mcp',
};

export function routeByVersion(request: NextRequest): {
  shouldRedirect: boolean;
  targetPath: string | null;
  version: APIVersion;
} {
  const url = new URL(request.url);
  const pathname = url.pathname;

  for (const [legacyPath, versionedPath] of Object.entries(VERSION_ROUTING_MAP)) {
    if (pathname === legacyPath || pathname.startsWith(legacyPath + '/')) {
      return {
        shouldRedirect: true,
        targetPath: pathname.replace(legacyPath, versionedPath),
        version: 'V1',
      };
    }
  }

  return {
    shouldRedirect: false,
    targetPath: null,
    version: apiVersionManager.getVersionFromPath(pathname) || 'V1',
  };
}

export function addVersionHeaders(response: NextResponse, version: APIVersion): NextResponse {
  const versionInfo = apiVersionManager.getVersionInfo(version);

  response.headers.set('X-API-Version', versionInfo.version);
  response.headers.set('X-API-Status', versionInfo.status);

  if (versionInfo.supportedUntil) {
    response.headers.set('X-API-Supported-Until', versionInfo.supportedUntil);
  }

  if (versionInfo.deprecated) {
    response.headers.set('Warning', `299 - "API version ${version} is deprecated"`);
    response.headers.set('Deprecation', 'true');
  }

  return response;
}
