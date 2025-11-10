
// 간단 데이터 테이블
export function DataTable({
  rows,
  maxHeight = 420,
}: {
  rows: Record<string, string>[];
  maxHeight?: number;
}) {
  if (!rows || rows.length === 0)
    return (
      <div className="text-sm text-muted-foreground">데이터가 없습니다.</div>
    );
  const cols = Object.keys(rows[0]);
  return (
    <div className="border rounded-2xl overflow-auto" style={{ maxHeight }}>
      <table className="min-w-full text-sm">
        <thead className="sticky top-0 bg-white shadow-sm">
          <tr>
            {cols.map((c) => (
              <th
                key={c}
                className="text-left px-3 py-2 font-semibold whitespace-nowrap border-b"
              >
                {c}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((r, i) => (
            <tr key={i} className="odd:bg-muted/30">
              {cols.map((c) => (
                <td key={c} className="px-3 py-1.5 whitespace-nowrap border-b">
                  {String(r[c] ?? "")}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
