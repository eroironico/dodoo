export default abstract class Command {
  public static Type = {
    CREATE: 0,
    UPDATE: 1,
    DELETE: 2,
    UNLINK: 3,
    LINK: 4,
    CLEAR: 5,
    SET: 6,
  } as const

  /**
   * Create new records in the comodel using values, link the created records to self.
   *
   * In case of a `Many2many` relation, one unique new record is created in the comodel such that all records in self are linked to the new record.
   *
   * In case of a `One2many` relation, one new record is created in the comodel for every record in self such that every record in self is linked to exactly one of the new records.
   *
   * Return the command triple
   */
  public static create(payload: Record<string, any>) {
    return [Command.Type.CREATE, 0, payload] as const
  }

  /**
   * Write values on the related record.
   *
   * Return the command triple
   */
  public static update(id: number, payload: Record<string, any>) {
    return [Command.Type.UPDATE, id, payload] as const
  }

  /**
   * Remove the related record from the database and remove its relation with self.
   *
   * In case of a `Many2many` relation, removing the record from the database may be prevented if it is still linked to other records.
   *
   * Return the command triple
   */
  public static delete(id: number) {
    return [Command.Type.DELETE, id, 0] as const
  }

  /**
   * Remove the relation between self and the related record.
   *
   * In case of a `One2many` relation, the given record is deleted from the database if the inverse field is set as ondelete='cascade'. Otherwise, the value of the inverse field is set to False and the record is kept.
   *
   * Return the command triple
   */
  public static unlink(id: number) {
    return [Command.Type.UNLINK, id, 0] as const
  }

  /**
   * Add a relation between self and the related record.
   *
   * Return the command triple
   */
  public static link(id: number) {
    return [Command.Type.LINK, id, 0] as const
  }

  /**
   * Remove all records from the relation with self. It behaves like executing the unlink command on every record.
   *
   * Return the command triple
   */
  public static clear() {
    return [Command.Type.CLEAR, 0, 0] as const
  }

  /**
   * Replace the current relations of self by the given ones. It behaves like executing the unlink command on every removed relation then executing the link command on every new relation.
   *
   * Return the command triple
   */
  public static set(...ids: Array<number>) {
    return [Command.Type.SET, 0, ids] as const
  }
}
