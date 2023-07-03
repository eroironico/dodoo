import {
  ModelQueryInput,
  ModelQueryMatcherValue,
  ModelQueryTriple,
  ModelQueryTripleValue,
  QueryTriple,
} from "../types"

export default abstract class QueryParser {
  public static Op = {
    /** equals to */
    EQUALS_TO: "=",
    /** not equals to */
    NOT_EQUALS_TO: "!=",
    /** greater than */
    GREATER_THAN: ">",
    /** greater than or equal to */
    GREATER_THAN_OR_EQUALS_TO: ">=",
    /** less than */
    LESS_THAN: "<",
    /** less than or equal to */
    LESS_THAN_OR_EQUALS_TO: "<=",
    /** unset or equals to (returns true if value is either None or False, otherwise behaves like =) */
    UNSET_OR_EQUALS_TO: "=?",
    /** matches field_name against the value pattern. An underscore _ in the pattern stands for (matches) any single character; a percent sign % matches any string of zero or more characters. */
    EQUALS_LIKE: "=like",
    /** matches field_name against the %value% pattern. Similar to =like but wraps value with ‘%’ before matching */
    LIKE: "like",
    /** doesn't match against the %value% pattern */
    NOT_LIKE: "not like",
    /** case insensitive like */
    ILIKE: "ilike",
    /** case insensitive not like */
    NOT_ILIKE: "not ilike",
    /** case insensitive =like */
    EQUALS_ILIKE: "=ilike",
    /** is equal to any of the items from value, value should be a list of items */
    IN: "in",
    /** is unequal to all of the items from value */
    NOT_IN: "not in",
    /**
     * is a child (descendant) of a value record (value can be either one item or a list of items).
     * Takes the semantics of the model into account (i.e following the relationship field named by _parent_name).
     * */
    CHILD_OF: "child_of",
    /**
     * is a parent (ascendant) of a value record (value can be either one item or a list of items).
     * Takes the semantics of the model into account (i.e following the relationship field named by _parent_name).
     */
    PARENT_OF: "parent_of",
  }

  private static _isSimpleMatcherValue(
    value: ModelQueryTripleValue | ModelQueryTriple | ModelQueryTriple[]
  ): value is ModelQueryTripleValue {
    if (
      typeof value === "string" ||
      typeof value === "number" ||
      typeof value === "boolean"
    )
      return true

    const containsOp = (v: any) => Object.keys(v).some(k => k in QueryParser.Op)

    return Array.isArray(value) ? !value.some(containsOp) : !containsOp(value)
  }

  private static _parseTriple(
    field: string,
    matcher: ModelQueryTripleValue | ModelQueryTriple | ModelQueryTriple[]
  ): QueryTriple {
    if (QueryParser._isSimpleMatcherValue(matcher))
      matcher = { EQUALS_TO: matcher }

    const [opName, value] = Object.entries(matcher).shift() as [
      keyof typeof QueryParser.Op,
      ModelQueryMatcherValue
    ]

    return [field, QueryParser.Op[opName as keyof typeof QueryParser.Op], value]
  }

  /**
   * Takes in input a human readable form of a query and parse it in the way Odoo needs
   * @param input The query to be parsed
   * @returns The parsed query
   */
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
