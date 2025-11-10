
import React from "react";
import { useVirtualizer } from "@tanstack/react-virtual";

// 간단 데이터 테이블 (가상화 적용)
export function DataTable({
  rows,
  maxHeight = 420,
}: {
  rows: Record<string, any>[];
  maxHeight?: number;
}) {
  if (!rows || rows.length === 0)
    return (
      <div className="text-sm text-muted-foreground">데이터가 없습니다.</div>
    );

  const cols = Object.keys(rows[0]);
  const parentRef = React.useRef<HTMLDivElement>(null);

  const rowVirtualizer = useVirtualizer({
    count: rows.length,
    getScrollElement: () => parentRef.current,
    estimateSize: () => 35, // 35px is an estimate for row height
    overscan: 5,
  });

  return (
    <div ref={parentRef} className="border rounded-2xl overflow-auto" style={{ maxHeight }}>
      <table className="min-w-full text-sm" style={{ width: '100%' }}>
        <thead className="sticky top-0 bg-white shadow-sm z-10">
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
        <tbody style={{ height: `${rowVirtualizer.getTotalSize()}px`, position: 'relative' }}>
          {rowVirtualizer.getVirtualItems().map((virtualItem) => {
            const row = rows[virtualItem.index];
            return (
              <tr
                key={virtualItem.index}
                style={{
                  position: 'absolute',
                  top: 0,
                  left: 0,
                  width: '100%',
                  height: `${virtualItem.size}px`,
                  transform: `translateY(${virtualItem.start}px)`,
                }}
                className={virtualItem.index % 2 === 0 ? "" : "bg-muted/30"}
              >
                {cols.map((c) => (
                  <td key={c} className="px-3 py-1.5 whitespace-nowrap border-b">
                    {String(row[c] ?? "")}
                  </td>
                ))}
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
