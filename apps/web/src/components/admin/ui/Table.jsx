import { useState, useMemo, useCallback } from "react";
import { forwardRef } from "react";
import Button from "./Button";
import Badge from "./Badge";
import Icon from "../../shared/Icon";

function TableHeader({ columns, sortConfig, onSort, className = "" }) {
  return (
    <thead className="bg-[#F6F1E6]">
      <tr>
        {columns.map((column) => (
          <th
            key={column.key}
            className={`px-4 py-3 text-left font-semibold text-[#14232B]/70 text-sm ${column.sortable ? "cursor-pointer hover:text-[#129E9E] select-none" : ""} ${column.align === "center" ? "text-center" : column.align === "right" ? "text-right" : ""} ${column.width ? `w-[${column.width}]` : ""}`}
            onClick={() => column.sortable && onSort(column.key)}
            style={{ userSelect: column.sortable ? "none" : "auto" }}
          >
            <div className="flex items-center gap-1.5 justify-start">
              <span>{column.label}</span>
              {column.sortable && sortConfig.key === column.key && (
                <Icon name={sortConfig.direction === "asc" ? "expand_more" : "expand_less"} size={16} className="text-[#129E9E]" />
              )}
              {column.sortable && sortConfig.key !== column.key && (
                <Icon name="expand_more" size={16} className="text-[#14232B]/30 rotate-180" />
              )}
            </div>
          </th>
        ))}
      </tr>
    </thead>
  );
}

function TableBody({ columns, data, keyField = "_id", rowClassName, onRowClick, emptyMessage = "No data available.", renderRowActions, className = "" }) {
  if (!data || data.length === 0) {
    return (
      <tbody>
        <tr>
          <td colSpan={columns.length} className="px-4 py-12 text-center text-[#14232B]/50">
            {emptyMessage}
          </td>
        </tr>
      </tbody>
    );
  }

  return (
    <tbody className="divide-y divide-[#14232B]/10">
      {data.map((row, rowIndex) => (
        <tr
          key={row[keyField] || rowIndex}
          className={`hover:bg-[#FAF6EE]/50 transition-colors ${rowClassName?.(row) || ""}`}
          onClick={() => onRowClick?.(row)}
        >
          {columns.map((column) => (
            <td
              key={column.key}
              className={`px-4 py-3 text-sm text-[#14232B] ${column.align === "center" ? "text-center" : column.align === "right" ? "text-right" : ""}`}
            >
              {column.render ? column.render(row[column.key], row) : row[column.key]}
            </td>
          ))}
          {renderRowActions && (
            <td className="px-4 py-3 text-right">
              {renderRowActions(row)}
            </td>
          )}
        </tr>
      ))}
    </tbody>
  );
}

function TablePagination({ page, totalPages, total, pageSize, onPageChange, onPageSizeChange, className = "" }) {
  if (totalPages <= 1) return null;

  const pages = useMemo(() => {
    const result = [];
    const showPages = 5;
    let start = Math.max(1, page - Math.floor(showPages / 2));
    let end = Math.min(totalPages, start + showPages - 1);

    if (end - start + 1 < showPages) {
      start = Math.max(1, end - showPages + 1);
    }

    for (let i = start; i <= end; i++) {
      result.push(i);
    }
    return result;
  }, [page, totalPages]);

  return (
    <div className={`flex flex-col sm:flex-row items-center justify-between gap-3 px-4 py-3 border-t border-[#14232B]/10 ${className}`}>
      <div className="flex items-center gap-2">
        <span className="text-sm text-[#14232B]/60">
          Showing {(page - 1) * pageSize + 1} to {Math.min(page * pageSize, total)} of {total}
        </span>
        <select
          value={pageSize}
          onChange={(e) => onPageSizeChange(Number(e.target.value))}
          className="px-2 py-1 text-sm border border-[#14232B]/15 rounded-lg bg-white focus:outline-none focus:border-[#129E9E]"
        >
          {[10, 20, 50, 100].map((size) => (
            <option key={size} value={size}>{size} per page</option>
          ))}
        </select>
      </div>
      <div className="flex items-center gap-2">
        <Button
          variant="secondary"
          size="sm"
          onClick={() => onPageChange(page - 1)}
          disabled={page === 1}
          aria-label="Previous page"
        >
          <Icon name="chevron_left" size={18} />
        </Button>
        {pages.map((p) => (
          <Button
            key={p}
            variant={p === page ? "primary" : "secondary"}
            size="sm"
            onClick={() => onPageChange(p)}
            className="min-w-[36px]"
            aria-label={`Page ${p}`}
            aria-current={p === page ? "page" : undefined}
          >
            {p}
          </Button>
        ))}
        <Button
          variant="secondary"
          size="sm"
          onClick={() => onPageChange(page + 1)}
          disabled={page === totalPages}
          aria-label="Next page"
        >
          <Icon name="chevron_right" size={18} />
        </Button>
      </div>
    </div>
  );
}

function TableToolbar({ searchValue, onSearchChange, filters = [], onFilterChange, actions, className = "" }) {
  return (
    <div className={`flex flex-col sm:flex-row gap-4 mb-4 ${className}`}>
      <div className="relative flex-1 max-w-sm">
        <Icon name="search" size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#14232B]/50" />
        <input
          type="search"
          placeholder="Search..."
          value={searchValue}
          onChange={(e) => onSearchChange(e.target.value)}
          className="w-full pl-10 pr-4 py-2 border border-[#14232B]/15 rounded-xl text-sm text-[#14232B] placeholder:text-[#14232B]/50 focus:outline-none focus:border-[#129E9E] focus:ring-1 focus:ring-[#129E9E]"
          aria-label="Search"
        />
      </div>
      {filters.map((filter) => (
        <select
          key={filter.key}
          value={filter.value}
          onChange={(e) => onFilterChange(filter.key, e.target.value)}
          className="px-3 py-2 border border-[#14232B]/15 rounded-xl text-sm text-[#14232B] bg-white focus:outline-none focus:border-[#129E9E] focus:ring-1 focus:ring-[#129E9E] min-w-[150px]"
        >
          {filter.options.map((opt) => (
            <option key={opt.value} value={opt.value}>{opt.label}</option>
          ))}
        </select>
      ))}
      <div className="flex items-center gap-2 ml-auto">
        {actions?.map((action, idx) => (
          <Button key={idx} {...action} />
        ))}
      </div>
    </div>
  );
}

const Table = forwardRef(({
  columns,
  data,
  keyField = "_id",
  sortable = true,
  initialSortKey,
  initialSortDirection = "desc",
  pageSize = 20,
  serverSide = false,
  totalCount,
  onSort,
  onPageChange,
  onPageSizeChange,
  rowClassName,
  onRowClick,
  renderRowActions,
  emptyMessage,
  toolbar,
  className = "",
  loading = false,
  ...props
}, ref) => {
  const [sortConfig, setSortConfig] = useState({
    key: initialSortKey,
    direction: initialSortDirection,
  });
  const [page, setPage] = useState(1);
  const [localPageSize, setLocalPageSize] = useState(pageSize);

  const handleSort = useCallback((key) => {
    if (!sortable) return;
    setSortConfig((prev) => ({
      key,
      direction: prev.key === key && prev.direction === "asc" ? "desc" : "asc",
    }));
    setPage(1);
    onSort?.(key, sortConfig.key === key && sortConfig.direction === "asc" ? "desc" : "asc");
  }, [sortable, sortConfig, onSort]);

  const handlePageChange = useCallback((newPage) => {
    setPage(newPage);
    onPageChange?.(newPage);
  }, [onPageChange]);

  const handlePageSizeChange = useCallback((newSize) => {
    setLocalPageSize(newSize);
    setPage(1);
    onPageSizeChange?.(newSize);
  }, [onPageSizeChange]);

  let processedData = data;
  if (!serverSide && sortable && sortConfig.key) {
    processedData = [...data].sort((a, b) => {
      const aVal = a[sortConfig.key];
      const bVal = b[sortConfig.key];
      if (aVal < bVal) return sortConfig.direction === "asc" ? -1 : 1;
      if (aVal > bVal) return sortConfig.direction === "asc" ? 1 : -1;
      return 0;
    });
  }

  const totalPages = serverSide ? Math.ceil(totalCount / localPageSize) : Math.ceil(processedData.length / localPageSize);
  const paginatedData = serverSide ? processedData : processedData.slice((page - 1) * localPageSize, page * localPageSize);

  return (
    <div ref={ref} className={`overflow-hidden rounded-2xl bg-white border border-[#14232B]/5 ${className}`} {...props}>
      {toolbar && (
        <div className="p-4 border-b border-[#14232B]/5 bg-[#FAF6EE]/50">
          {toolbar}
        </div>
      )}
      <div className="overflow-x-auto">
        <table className="w-full min-w-[700px]">
          <TableHeader columns={columns} sortConfig={sortConfig} onSort={handleSort} />
          <TableBody
            columns={columns}
            data={paginatedData}
            keyField={keyField}
            rowClassName={rowClassName}
            onRowClick={onRowClick}
            emptyMessage={emptyMessage}
            renderRowActions={renderRowActions}
          />
        </table>
      </div>
      {!serverSide && (
        <TablePagination
          page={page}
          totalPages={totalPages}
          total={processedData.length}
          pageSize={localPageSize}
          onPageChange={handlePageChange}
          onPageSizeChange={handlePageSizeChange}
        />
      )}
      {serverSide && totalCount !== undefined && (
        <TablePagination
          page={page}
          totalPages={totalPages}
          total={totalCount}
          pageSize={localPageSize}
          onPageChange={handlePageChange}
          onPageSizeChange={handlePageSizeChange}
        />
      )}
      {loading && (
        <div className="absolute inset-0 bg-white/80 flex items-center justify-center z-10">
          <div className="animate-spin rounded-full h-8 w-8 border-3 border-[#129E9E] border-t-transparent" />
        </div>
      )}
    </div>
  );
});

Table.displayName = "Table";

export { TableHeader, TableBody, TablePagination, TableToolbar };
export default Table;