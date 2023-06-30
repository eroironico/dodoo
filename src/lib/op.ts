const Op = {
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

export default Op
