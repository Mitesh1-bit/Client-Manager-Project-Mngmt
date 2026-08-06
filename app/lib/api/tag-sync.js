/**
 * `createCompany`/`updateCompany`/`createProject`/`updateProject` don't take
 * a `tagIds` argument — tags are assigned separately via `addTag`/`removeTag`.
 * Call this after the entity is saved and its id is known, diffing the form's
 * selection against what was there before so only the changed tags move.
 *
 * @param {{
 *   addTag: (opts: { variables: object }) => Promise<unknown>,
 *   removeTag: (opts: { variables: object }) => Promise<unknown>,
 *   entityType: string,
 *   entityId: string,
 *   previousTagIds?: string[],
 *   nextTagIds?: string[],
 * }} options
 */
export async function syncEntityTags({
  addTag,
  removeTag,
  entityType,
  entityId,
  previousTagIds = [],
  nextTagIds = [],
}) {
  const previous = new Set(previousTagIds);
  const next = new Set(nextTagIds);
  const toAdd = nextTagIds.filter((tagId) => !previous.has(tagId));
  const toRemove = previousTagIds.filter((tagId) => !next.has(tagId));

  await Promise.all([
    ...toAdd.map((tagId) => addTag({ variables: { entityType, entityId, tagId } })),
    ...toRemove.map((tagId) => removeTag({ variables: { entityType, entityId, tagId } })),
  ]);
}
