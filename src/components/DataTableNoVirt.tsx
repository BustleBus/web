import React from "react";

// 가상화 제거 버전 - 모든 Rows 렌더링
export function DataTableNoVirt<T extends Record<string, any>>({
    rows,
    maxHeight = 420,
}: {
    rows: T[];
    maxHeight?: number;
}) {
    if (!rows || rows.length === 0)
        return (
            <div className="text-sm text-muted-foreground">데이터가 없습니다.</div>
        );

    const cols = Object.keys(rows[0]);

    return (
        <div
            className="border rounded-2xl overflow-auto"
            style={{ maxHeight }}
        >
            <table className="min-w-full text-sm w-full border-collapse">
                <thead className="sticky top-0 bg-white shadow-sm z-10">
                    <tr>
                        {cols.map((c) => (
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
                    {rows.map((row, index) => {
                        return (
                            <tr
                                key={index}
                                className={index % 2 === 0 ? "" : "bg-muted/30"}
                            >
                                {cols.map((c) => {
                                    let displayValue = row[c] ?? "";

                                    // Format time column for better readability
                                    if (c === "time" && row[c]) {
                                        try {
                                            const date = new Date(row[c]);
                                            displayValue = date.toLocaleString('ko-KR', {
                                                year: 'numeric',
                                                month: '2-digit',
                                                day: '2-digit',
                                                hour: '2-digit',
                                                minute: '2-digit',
                                                second: '2-digit',
                                                hour12: false
                                            });
                                        } catch (e) {
                                            displayValue = String(row[c]);
                                        }
                                    }

                                    return (
                                        <td
                                            key={c}
                                            className="px-3 py-1.5 whitespace-nowrap border-b overflow-hidden text-ellipsis"
                                        >
                                            {String(displayValue)}
                                        </td>
                                    );
                                })}
                            </tr>
                        );
                    })}
                </tbody>
            </table>
        </div>
    );
}
