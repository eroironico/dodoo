import Op from "./op"
import {
  ModelQueryInput,
  ModelQueryMatcherValue,
  ModelQueryTriple,
  ModelQueryTripleValue,
  QueryTriple,
} from "../types"

export default abstract class QueryParser {
  public static Op = Op

  private static _isSimpleMatcherValue(
    value: ModelQueryTripleValue | ModelQueryTriple | ModelQueryTriple[]
  ): value is ModelQueryTripleValue {
    if (
      typeof value === "string" ||
      typeof value === "number" ||
      typeof value === "boolean"
    )
      return true

    const containsOp = (v: any) => Object.keys(v).some(k => k in Op)

    return Array.isArray(value) ? !value.some(containsOp) : !containsOp(value)
  }

  private static _parseTriple(
    field: string,
    matcher: ModelQueryTripleValue | ModelQueryTriple | ModelQueryTriple[]
  ): QueryTriple {
    if (QueryParser._isSimpleMatcherValue(matcher))
      matcher = { EQUALS_TO: matcher }

    const [opName, value] = Object.entries(matcher).shift() as [
      keyof typeof Op,
      ModelQueryMatcherValue
    ]

    return [field, Op[opName] as keyof typeof Op, value]
  }

  public static parse(input: ModelQueryInput): Array<string | QueryTriple> {
    const orderedKeys = Object.keys(input).sort((ka, kb) => {
      if (ka === "NOT") return 1
      if (ka === "OR") return kb === "NOT" ? -1 : 1
      if (ka === "AND") return kb === "OR" ? -1 : 1
      if (kb === "AND") return -1

      return 0
    })
    const parsed = []

    for (const key of orderedKeys) {
      if (!/AND|OR|NOT/.test(key)) {
        const [field, op, value] = QueryParser._parseTriple(
          key,
          input[key as keyof typeof input]!
        )
        if (typeof value === "object" && !Array.isArray(value))
          throw new Error(`Invalid value for field ${field}`)

        parsed.push([field, op, value] satisfies QueryTriple)
      }
      const value = (
        Array.isArray(input[key as keyof typeof input])
          ? input[key as keyof typeof input]
          : [input[key as keyof typeof input]]
      ) as Array<ModelQueryTriple>
      const terms = value
        .map(term => Object.entries(term).shift() || [])
        .filter(([tk, tv]) => tk !== undefined && tv !== undefined)

      switch (key) {
        case "AND":
          if (value.length < 2)
            throw new Error("AND operator requires at least 2 terms")

          terms.forEach(([tk, tv]) =>
            parsed.push(QueryParser._parseTriple(tk, tv))
          )
          break
        case "OR":
          if (value.length < 2)
            throw new Error("OR operator requires at least 2 terms")

          terms.forEach(([tk, tv], ti) => {
            if (ti < value.length - 1) parsed.push("|")
            parsed.push(QueryParser._parseTriple(tk, tv))
          })
          break
        case "NOT":
          terms.forEach(([tk, tv]) =>
            parsed.push("!", QueryParser._parseTriple(tk, tv))
          )
      }
    }

    return parsed
  }
}
