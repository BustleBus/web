import React from "react";
import { useVirtualizer } from "@tanstack/react-virtual";

// 간단 데이터 테이블 (가상화 적용 - 일반 흐름 방식)
export function DataTable({
  rows,
  maxHeight = 420,
}: {
  rows: Record<string, string | number>[];
  maxHeight?: number;
}) {
  const parentRef = React.useRef<HTMLDivElement>(null);

  const rowVirtualizer = useVirtualizer({
    count: rows.length,
    getScrollElement: () => parentRef.current,
    estimateSize: () => 35,
    overscan: 5,
  });

  if (!rows || rows.length === 0)
    return (
      <div className="text-sm text-muted-foreground">데이터가 없습니다.</div>
    );

  const cols = Object.keys(rows[0]);
  const virtualItems = rowVirtualizer.getVirtualItems();

  // 상단 여백 계산 (렌더링되지 않은 위쪽 row들의 높이 합)
  const paddingTop = virtualItems.length > 0 ? virtualItems[0].start : 0;
  // 하단 여백 계산 (렌더링되지 않은 아래쪽 row들의 높이 합)
  const paddingBottom =
    virtualItems.length > 0
      ? rowVirtualizer.getTotalSize() - virtualItems[virtualItems.length - 1].end
      : 0;

  return (
    <div
      ref={parentRef}
      className="border rounded-2xl overflow-auto"
      style={{ maxHeight }}
    >
      <table className="min-w-full text-sm w-full border-collapse">
        <thead className="sticky top-0 bg-white shadow-sm z-10">
          <tr>
            {cols.map((c) => (
              // 팁: 열 너비가 계속 변한다면 여기에 style={{ width: '...' }} 로 고정 너비를 주는 것이 좋습니다.
              <th
                key={c}
                className="text-left px-3 py-2 font-semibold whitespace-nowrap border-b bg-white"
              >
                {c}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {/* 상단 빈 공간 */}
          {paddingTop > 0 && (
            <tr>
              <td style={{ height: `${paddingTop}px` }} colSpan={cols.length} />
            </tr>
          )}

          {/* 실제 렌더링 될 Rows */}
          {virtualItems.map((virtualItem) => {
            const row = rows[virtualItem.index];
            return (
              <tr
                key={virtualItem.key}
                data-index={virtualItem.index}
                ref={rowVirtualizer.measureElement} // 동적 높이 측정이 필요할 경우 사용
                className={virtualItem.index % 2 === 0 ? "" : "bg-muted/30"}
              >
                {cols.map((c) => (
                  <td
                    key={c}
                    className="px-3 py-1.5 whitespace-nowrap border-b overflow-hidden text-ellipsis"
                  >
                    {String(row[c] ?? "")}
                  </td>
                ))}
              </tr>
            );
          })}

          {/* 하단 빈 공간 */}
          {paddingBottom > 0 && (
            <tr>
              <td style={{ height: `${paddingBottom}px` }} colSpan={cols.length} />
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
}