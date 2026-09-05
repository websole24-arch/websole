// Every model's `update(id, fields)` built its `SET col = $n, ...` clause
// the same way: walk a fixed { jsKey: columnName } map, skip any key not
// present in `fields`, and number the placeholders as it goes. Six
// models (CountryPricing, FreeToolLink, Package, PortfolioProject,
// Service, User) had this exact loop copy-pasted with only the map and
// table name differing — this is the one shared copy.
//
// Returns { sets, values }, e.g. sets: ['name = $1', 'is_active = $2'],
// values: ['New name', true]. Callers append the id as the final
// parameter themselves (its placeholder index is values.length + 1
// once they push it), since the WHERE clause differs by call site.
const buildUpdateSet = (columnMap, fields) => {
  const sets = [];
  const values = [];
  for (const [key, column] of Object.entries(columnMap)) {
    if (fields[key] !== undefined) {
      values.push(fields[key]);
      sets.push(`${column} = $${values.length}`);
    }
  }
  return { sets, values };
};

module.exports = buildUpdateSet;
