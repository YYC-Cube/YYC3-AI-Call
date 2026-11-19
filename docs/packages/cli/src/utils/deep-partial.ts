import { z } from "zod"

/**
 * Zod 4 兼容层：deepPartial
 * Zod 4 移除了 ZodObject.deepPartial()，此为官方迁移指南思路的等价实现。
 * 递归将对象内层 ZodObject 字段转为 optional。
 */
export function deepPartial(schema: z.ZodObject<any>): z.ZodObject<any> {
  const newShape: Record<string, z.ZodTypeAny> = {}

  for (const key of Object.keys(schema.shape)) {
    const field = schema.shape[key] as z.ZodTypeAny
    let newField: z.ZodTypeAny

    if (field instanceof z.ZodObject) {
      newField = z.optional(deepPartial(field))
    } else if (
      field instanceof z.ZodOptional &&
      field.unwrap() instanceof z.ZodObject
    ) {
      newField = z.optional(deepPartial(field.unwrap() as z.ZodObject<any>))
    } else {
      newField = z.optional(field)
    }

    newShape[key] = newField
  }

  return z.object(newShape) as z.ZodObject<any>
}
