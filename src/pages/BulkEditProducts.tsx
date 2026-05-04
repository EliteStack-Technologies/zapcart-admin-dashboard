import { useEffect, useState, useRef, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import DashboardLayout from "@/components/DashboardLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { getProduct, bulkUpdateProducts } from "@/services/product";
import { getCategory } from "@/services/category";
import { getSections } from "@/services/rows";
import { getOfferTags } from "@/services/offersTags";
import { useCurrency } from "@/contexts/CurrencyContext";
import {
  ArrowLeft,
  Save,
  Search,
  RotateCcw,
  Loader2,
  AlertCircle,
  ChevronLeft,
  ChevronRight,
  Columns3,
  CheckSquare,
  Square,
  Filter,
  X,
} from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";

// ─── Types ────────────────────────────────────────────────────────────────────

interface ProductRow {
  _id: string;
  product_id: number;
  title: string;
  product_code: string;
  actual_price: number;
  offer_price: number;
  unit_type: string;
  stock_count: number;
  status: string;
  category_id: string[];
  category_name: string;
  section_id: string[];
  section_name: string;
  offer_id: string;
  offer_name: string;
  offer_start_date: string;
  offer_end_date: string;
  image: string;
}

// ─── All available columns definition ────────────────────────────────────────

const ALL_COLS = [
  { key: "title",            label: "Title",            type: "text",         width: 260, defaultOn: true  },
  { key: "product_code",     label: "Product Code",     type: "text",         width: 120, defaultOn: false  },
  { key: "actual_price",     label: "Actual Price",     type: "number",       width: 120, defaultOn: true  },
  { key: "offer_price",      label: "Offer Price",      type: "number",       width: 120, defaultOn: true  },
  { key: "unit_type",        label: "Unit Type",        type: "text",         width: 100, defaultOn: false },
  { key: "stock_count",      label: "Stock Count",      type: "number",       width: 110, defaultOn: false },
  { key: "status",           label: "Status",           type: "select",       width: 120, defaultOn: false  },
  { key: "category_id",      label: "Category",         type: "cat-select",   width: 180, defaultOn: false  },
  { key: "section_id",       label: "Section",          type: "sec-select",   width: 180, defaultOn: false },
  { key: "offer_id",         label: "Offer Tag",        type: "offer-select", width: 160, defaultOn: false  },
  { key: "offer_start_date", label: "Offer Start Date", type: "date",         width: 150, defaultOn: false  },
  { key: "offer_end_date",   label: "Offer End Date",   type: "date",         width: 150, defaultOn: false  },
] as const;

type ColKey = typeof ALL_COLS[number]["key"];
type ColDef = typeof ALL_COLS[number];

// Default page limit
const DEFAULT_LIMIT = 50;

// ─── Component ────────────────────────────────────────────────────────────────

const BulkEditProducts = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { currency } = useCurrency();

  // ── State ──────────────────────────────────────────────────────────────────
  const [rows, setRows] = useState<ProductRow[]>([]);
  const [original, setOriginal] = useState<ProductRow[]>([]);
  const [changedIds, setChangedIds] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(DEFAULT_LIMIT);
  const [totalPages, setTotalPages] = useState(1);
  const [totalProducts, setTotalProducts] = useState(0);
  const [categories, setCategories] = useState<any[]>([]);
  const [sections, setSections] = useState<any[]>([]);
  const [offers, setOffers] = useState<any[]>([]);
  const [activeCell, setActiveCell] = useState<{ row: number; col: ColKey } | null>(null);

  // ── Filter state ───────────────────────────────────────────────────────────
  const [filterCategory, setFilterCategory] = useState("");
  const [filterSection, setFilterSection] = useState("");
  const [filterStatus, setFilterStatus] = useState("");
  const [filterOffer, setFilterOffer] = useState("");
  const [showFilters, setShowFilters] = useState(false);

  // Column visibility — start with defaultOn columns checked
  const [visibleCols, setVisibleCols] = useState<Set<ColKey>>(
    new Set(ALL_COLS.filter((c) => c.defaultOn).map((c) => c.key))
  );

  const tableRef = useRef<HTMLDivElement>(null);

  // Derived: only visible columns in order
  const activeCols = ALL_COLS.filter((c) => visibleCols.has(c.key));

  // ── Helpers ────────────────────────────────────────────────────────────────

  const flattenProduct = (p: any): ProductRow => {
    const getIds = (field: any): string[] => {
      if (!field) return [];
      if (Array.isArray(field)) return field.map(f => f?._id ?? f).filter(Boolean);
      return [field?._id ?? field].filter(Boolean);
    };

    const getNames = (field: any): string => {
      if (!field) return "";
      if (Array.isArray(field)) return field.map(f => f?.name ?? "").filter(Boolean).join(", ");
      return field?.name ?? "";
    };

    return {
      _id: p._id,
      product_id: p.product_id,
      title: p.title ?? "",
      product_code: p.product_code ?? "",
      actual_price: p.actual_price ?? 0,
      offer_price: p.offer_price ?? 0,
      unit_type: p.unit_type ?? "",
      stock_count: p.stock_count ?? 0,
      status: p.status ?? "active",
      category_id: getIds(p.category_id),
      category_name: getNames(p.category_id),
      section_id: getIds(p.section_id),
      section_name: getNames(p.section_id),
      offer_id: Array.isArray(p.offer_id) ? p.offer_id[0]?._id ?? p.offer_id[0] ?? "" : p.offer_id?._id ?? p.offer_id ?? "",
      offer_name: Array.isArray(p.offer_id) ? p.offer_id[0]?.name ?? "" : p.offer_id?.name ?? "",
      offer_start_date: p.offer_start_date ? p.offer_start_date.slice(0, 10) : "",
      offer_end_date: p.offer_end_date ? p.offer_end_date.slice(0, 10) : "",
      image: p.image ?? "",
    };
  };

  // ── Fetch products ──────────────────────────────────────────────────────────

  // ── Debounced search ────────────────────────────────────────────────────────
  const [debouncedSearch, setDebouncedSearch] = useState(search);
  useEffect(() => {
    const timer = setTimeout(() => setDebouncedSearch(search), 500);
    return () => clearTimeout(timer);
  }, [search]);

  const fetchProducts = useCallback(async () => {
    setLoading(true);
    try {
      const filters = {
        category_id: filterCategory || undefined,
        section_id: filterSection || undefined,
        status: filterStatus || undefined,
        offer_id: filterOffer || undefined,
      };
      const data = await getProduct(page, limit, debouncedSearch || undefined, filters, "name-asc");
      const flattened: ProductRow[] = (data?.products ?? []).map(flattenProduct);
      setRows(flattened);
      setOriginal(JSON.parse(JSON.stringify(flattened)));
      setChangedIds(new Set());
      setTotalPages(data?.totalPages ?? 1);
      setTotalProducts(data?.total ?? 0);
    } catch {
      toast({ title: "Error", description: "Failed to load products", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  }, [page, limit, debouncedSearch, filterCategory, filterSection, filterStatus, filterOffer]);

  useEffect(() => { fetchProducts(); }, [fetchProducts]);

  // ── Fetch categories, sections & offers ────────────────────────────────────

  useEffect(() => {
    const load = async () => {
      const [cats, secs, ofrs] = await Promise.all([
        getCategory().catch(() => []),
        getSections().catch(() => ({ sections: [] })),
        getOfferTags().catch(() => []),
      ]);
      setCategories(Array.isArray(cats) ? cats : []);
      const secList = secs?.sections ?? secs?.data ?? (Array.isArray(secs) ? secs : []);
      setSections(secList);
      setOffers(Array.isArray(ofrs) ? ofrs : []);
    };
    load();
  }, []);

  // ── Column visibility toggles ───────────────────────────────────────────────

  const toggleCol = (key: ColKey) => {
    setVisibleCols((prev) => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });
  };

  const selectAllCols = () => setVisibleCols(new Set(ALL_COLS.map((c) => c.key)));
  const clearAllCols  = () => setVisibleCols(new Set(["title"] as ColKey[])); // keep at least title

  // ── Cell change ─────────────────────────────────────────────────────────────

  const handleChange = (rowIdx: number, col: ColKey, value: any) => {
    setRows((prev) => {
      const next = [...prev];
      const row = { ...next[rowIdx], [col]: value };

      if (col === "category_id") {
        row.category_name = (value as string[])
          .map((id) => categories.find((c) => c._id === id)?.name)
          .filter(Boolean)
          .join(", ");
      }
      if (col === "section_id") {
        row.section_name = (value as string[])
          .map((id) => sections.find((s) => s._id === id)?.name)
          .filter(Boolean)
          .join(", ");
      }
      if (col === "offer_id") {
        const ofr = offers.find((o) => o._id === value);
        row.offer_name = ofr?.name ?? "";
      }

      next[rowIdx] = row;

      setChangedIds((prev) => {
        const s = new Set(prev);
        const orig = original[rowIdx];
        
        const isDifferent = Object.keys(row).some((k) => {
          if (k === "category_name" || k === "section_name" || k === "offer_name") return false;
          
          const rv = (row as any)[k];
          const ov = (orig as any)[k];
          
          if (k === "actual_price" || k === "offer_price" || k === "stock_count") {
            return Number(rv) !== Number(ov);
          }
          
          // For dates, compare strings after ensuring they are defined
          if (k === "offer_start_date" || k === "offer_end_date") {
            return (rv || "") !== (ov || "");
          }

          return rv !== ov;
        });

        if (isDifferent) s.add(row._id);
        else s.delete(row._id);
        return s;
      });

      return next;
    });
  };

  // ── Save ────────────────────────────────────────────────────────────────────

  const handleSave = async () => {
    if (changedIds.size === 0) {
      toast({ title: "No changes", description: "Nothing to save." });
      return;
    }
    setSaving(true);
    try {
      const changed = rows
        .filter((r) => changedIds.has(r._id))
        .map((r) => ({
          _id: r._id,
          title: r.title,
          product_code: r.product_code,
          actual_price: Number(r.actual_price),
          offer_price: Number(r.offer_price),
          unit_type: r.unit_type,
          stock_count: Number(r.stock_count),
          status: r.status,
          category_id: r.category_id || [],
          section_id: r.section_id || [],
          offer_id: r.offer_id || null,
          offer_start_date: r.offer_start_date || null,
          offer_end_date: r.offer_end_date || null,
        }));

      const result = await bulkUpdateProducts(changed);

      toast({
        title: "✅ Saved successfully",
        description: `${result.modified ?? changed.length} product(s) updated.`,
      });

      setOriginal(JSON.parse(JSON.stringify(rows)));
      setChangedIds(new Set());
    } catch (err: any) {
      toast({ title: "Error", description: err.message, variant: "destructive" });
    } finally {
      setSaving(false);
    }
  };

  // ── Reset ───────────────────────────────────────────────────────────────────

  const handleReset = () => {
    setRows(JSON.parse(JSON.stringify(original)));
    setChangedIds(new Set());
  };

  // ── Keyboard navigation ─────────────────────────────────────────────────────

  const handleKeyDown = (e: React.KeyboardEvent, rowIdx: number, colIdx: number) => {
    if (e.key === "Tab") {
      e.preventDefault();
      const nextColIdx = e.shiftKey ? colIdx - 1 : colIdx + 1;
      if (nextColIdx >= 0 && nextColIdx < activeCols.length) {
        setActiveCell({ row: rowIdx, col: activeCols[nextColIdx].key });
      } else if (!e.shiftKey && rowIdx + 1 < rows.length) {
        setActiveCell({ row: rowIdx + 1, col: activeCols[0].key });
      } else if (e.shiftKey && rowIdx > 0) {
        setActiveCell({ row: rowIdx - 1, col: activeCols[activeCols.length - 1].key });
      }
    }
    if (e.key === "ArrowDown" && rowIdx + 1 < rows.length) {
      e.preventDefault();
      setActiveCell({ row: rowIdx + 1, col: activeCols[colIdx].key });
    }
    if (e.key === "ArrowUp" && rowIdx > 0) {
      e.preventDefault();
      setActiveCell({ row: rowIdx - 1, col: activeCols[colIdx].key });
    }
    if (e.key === "ArrowRight" && colIdx + 1 < activeCols.length) {
      const target = e.target as HTMLInputElement;
      // Only navigate if cursor is at the end of input
      if (target.selectionEnd === target.value.length) {
        e.preventDefault();
        setActiveCell({ row: rowIdx, col: activeCols[colIdx + 1].key });
      }
    }
    if (e.key === "ArrowLeft" && colIdx > 0) {
      const target = e.target as HTMLInputElement;
      // Only navigate if cursor is at the start of input
      if (target.selectionStart === 0) {
        e.preventDefault();
        setActiveCell({ row: rowIdx, col: activeCols[colIdx - 1].key });
      }
    }
    if (e.key === "Enter") {
      e.preventDefault();
      if (rowIdx + 1 < rows.length) setActiveCell({ row: rowIdx + 1, col: activeCols[colIdx].key });
    }
    if (e.key === "Escape") setActiveCell(null);
  };

  // ── Render cell ─────────────────────────────────────────────────────────────

  const renderCell = (row: ProductRow, rowIdx: number, col: ColDef, colIdx: number) => {
    const val = (row as any)[col.key];
    const baseInputClass =
      "h-8 w-full border-0 rounded-none bg-transparent focus:ring-2 focus:ring-blue-500 focus:ring-inset text-sm px-2";

    if (col.type === "select") {
      return (
        <Select value={val} onValueChange={(v) => handleChange(rowIdx, col.key, v)}>
          <SelectTrigger className="h-8 border-0 bg-transparent text-sm rounded-none focus:ring-2 focus:ring-blue-500">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="active"><span className="text-green-600 font-medium">Active</span></SelectItem>
            <SelectItem value="inactive"><span className="text-red-500 font-medium">Inactive</span></SelectItem>
          </SelectContent>
        </Select>
      );
    }

    if (col.type === "cat-select" || col.type === "sec-select") {
      const options = col.type === "cat-select" ? categories : sections;
      const selectedIds = (val as string[]) || [];
      const placeholder = col.type === "cat-select" ? "Select Category" : "Select Section";

      return (
        <Popover>
          <PopoverTrigger asChild>
            <div className="h-8 w-full flex items-center px-2 cursor-pointer hover:bg-muted/50 overflow-hidden whitespace-nowrap text-xs">
              {selectedIds.length > 0 ? (
                <span className="truncate">
                  {selectedIds
                    .map((id) => options.find((o) => o._id === id)?.name)
                    .filter(Boolean)
                    .join(", ")}
                </span>
              ) : (
                <span className="text-muted-foreground">{placeholder}</span>
              )}
            </div>
          </PopoverTrigger>
          <PopoverContent className="w-64 p-0 shadow-xl border-2" align="start">
            <div className="p-2 border-b bg-muted/30 flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                {col.label}
              </span>
              {selectedIds.length > 0 && (
                <Button 
                  variant="ghost" 
                  size="sm" 
                  className="h-6 px-1.5 text-[10px] hover:text-red-600"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleChange(rowIdx, col.key, []);
                  }}
                >
                  Clear All
                </Button>
              )}
            </div>
            <div className="p-1 max-h-60 overflow-y-auto custom-scrollbar">
              {options.length === 0 ? (
                <div className="p-4 text-center text-xs text-muted-foreground">No options available</div>
              ) : (
                options.map((opt) => {
                  const isChecked = selectedIds.includes(opt._id);
                  return (
                    <div
                      key={opt._id}
                      className={`flex items-center gap-2.5 px-2 py-1.5 rounded cursor-pointer transition-colors ${
                        isChecked ? "bg-primary/5 text-primary font-medium" : "hover:bg-muted"
                      }`}
                      onClick={(e) => {
                        e.stopPropagation();
                        const next = isChecked
                          ? selectedIds.filter((id) => id !== opt._id)
                          : [...selectedIds, opt._id];
                        handleChange(rowIdx, col.key, next);
                      }}
                    >
                      <Checkbox 
                        checked={isChecked} 
                        className="pointer-events-none" 
                        onCheckedChange={() => {}} // handled by parent div click
                      />
                      <span className="text-sm flex-1 truncate">{opt.name}</span>
                    </div>
                  );
                })
              )}
            </div>
          </PopoverContent>
        </Popover>
      );
    }

    if (col.type === "offer-select") {
      return (
        <Select value={val || "__none__"} onValueChange={(v) => handleChange(rowIdx, col.key, v === "__none__" ? "" : v)}>
          <SelectTrigger className="h-8 border-0 bg-transparent text-xs rounded-none focus:ring-2 focus:ring-blue-500">
            <SelectValue placeholder="—" />
          </SelectTrigger>
          <SelectContent className="max-h-60">
            <SelectItem value="__none__">— None —</SelectItem>
            {offers.map((o) => (
              <SelectItem key={o._id} value={o._id}>
                <span className="flex items-center gap-1.5">
                  {o.color_code && <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: o.color_code }} />}
                  {o.name}
                </span>
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      );
    }

    if (col.type === "date") {
      return (
        <Input
          type="date"
          value={val ?? ""}
          className="h-8 w-full border-0 rounded-none bg-transparent focus:ring-2 focus:ring-blue-500 focus:ring-inset text-xs px-2"
          onClick={() => setActiveCell({ row: rowIdx, col: col.key })}
          onChange={(e) => handleChange(rowIdx, col.key, e.target.value)}
          onKeyDown={(e) => handleKeyDown(e, rowIdx, colIdx)}
          onFocus={() => setActiveCell({ row: rowIdx, col: col.key })}
        />
      );
    }

    return (
      <Input
        type={col.type === "number" ? "number" : "text"}
        value={val ?? ""}
        className={baseInputClass}
        onClick={() => setActiveCell({ row: rowIdx, col: col.key })}
        onChange={(e) =>
          handleChange(rowIdx, col.key, e.target.value)
        }
        onKeyDown={(e) => handleKeyDown(e, rowIdx, colIdx)}
        onFocus={() => setActiveCell({ row: rowIdx, col: col.key })}
        step={col.type === "number" ? "0.01" : undefined}
      />
    );
  };

  // ── Render ──────────────────────────────────────────────────────────────────

  return (
    <DashboardLayout>
      <div className="flex flex-col h-[calc(100vh-140px)] lg:h-[calc(100vh-90px)] -m-2 sm:-m-6 lg:-m-8 bg-background overflow-hidden">

        {/* ── Toolbar ── */}
        <div className="flex items-center justify-between px-4 py-3 border-b bg-background shrink-0 gap-3 flex-wrap">
          <div className="flex items-center gap-3">
            <Button variant="ghost" size="sm" onClick={() => navigate("/products")}>
              <ArrowLeft className="w-4 h-4 mr-1" /> Back
            </Button>
            <div>
              <h1 className="text-lg font-bold leading-none">Bulk Edit Products</h1>
              <p className="text-xs text-muted-foreground mt-0.5">
                {totalProducts} products ·{" "}
                {changedIds.size > 0 ? (
                  <span className="text-amber-600 font-medium">
                    {changedIds.size} unsaved change{changedIds.size > 1 ? "s" : ""}
                  </span>
                ) : "No changes"}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 flex-wrap">

            {/* Search */}
            <div className="relative">
              <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground" />
              <Input
                placeholder="Search products..."
                className="pl-8 h-8 w-48 text-sm"
                value={search}
                onChange={(e) => { setSearch(e.target.value); setPage(1); }}
              />
            </div>

            {/* Filter toggle */}
            <Button
              variant={showFilters ? "default" : "outline"}
              size="sm"
              className="gap-1.5"
              onClick={() => setShowFilters((v) => !v)}
            >
              <Filter className="w-3.5 h-3.5" />
              Filters
              {(filterCategory || filterSection || filterStatus || filterOffer) && (
                <span className="ml-1 text-xs bg-white text-primary rounded-full w-4 h-4 flex items-center justify-center font-bold">
                  {[filterCategory, filterSection, filterStatus, filterOffer].filter(Boolean).length}
                </span>
              )}
            </Button>

            {/* ── Column Picker ── */}
            <Popover>
              <PopoverTrigger asChild>
                <Button variant="outline" size="sm" className="gap-1.5">
                  <Columns3 className="w-3.5 h-3.5" />
                  Columns
                  <span className="ml-1 text-xs bg-primary text-primary-foreground rounded-full w-4 h-4 flex items-center justify-center font-bold">
                    {visibleCols.size}
                  </span>
                </Button>
              </PopoverTrigger>
              <PopoverContent align="end" className="w-64 p-0">
                {/* Header */}
                <div className="flex items-center justify-between px-3 py-2 border-b">
                  <span className="text-sm font-semibold">Show / Hide Columns</span>
                  <div className="flex gap-1">
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-6 px-2 text-xs gap-1"
                      onClick={selectAllCols}
                    >
                      <CheckSquare className="w-3 h-3" /> All
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-6 px-2 text-xs gap-1"
                      onClick={clearAllCols}
                    >
                      <Square className="w-3 h-3" /> None
                    </Button>
                  </div>
                </div>

                {/* Column checkboxes */}
                <div className="p-2 space-y-0.5">
                  {ALL_COLS.map((col) => {
                    const checked = visibleCols.has(col.key);
                    return (
                      <div
                        key={col.key}
                        className="flex items-center gap-2.5 px-2 py-1.5 rounded hover:bg-muted cursor-pointer"
                        onClick={() => toggleCol(col.key)}
                      >
                        <Checkbox
                          checked={checked}
                          onCheckedChange={() => toggleCol(col.key)}
                          id={`col-${col.key}`}
                          className="shrink-0"
                        />
                        <Label
                          htmlFor={`col-${col.key}`}
                          className="cursor-pointer text-sm flex-1 select-none"
                        >
                          {col.label}
                        </Label>
                        {checked && (
                          <span className="text-[10px] text-muted-foreground">visible</span>
                        )}
                      </div>
                    );
                  })}
                </div>

                {/* Footer hint */}
                <div className="px-3 py-2 border-t text-[10px] text-muted-foreground">
                  {visibleCols.size} of {ALL_COLS.length} columns visible
                </div>
              </PopoverContent>
            </Popover>

            {changedIds.size > 0 && (
              <Button variant="outline" size="sm" onClick={handleReset} className="gap-1">
                <RotateCcw className="w-3.5 h-3.5" /> Reset
              </Button>
            )}

            <Button
              size="sm"
              onClick={handleSave}
              disabled={saving || changedIds.size === 0}
              className="gap-1 min-w-[110px]"
            >
              {saving ? (
                <><Loader2 className="w-3.5 h-3.5 animate-spin" /> Saving…</>
              ) : (
                <><Save className="w-3.5 h-3.5" /> Save ({changedIds.size})</>
              )}
            </Button>
          </div>
        </div>

        {/* ── Unsaved changes banner ── */}
        {changedIds.size > 0 && (
          <div className="flex items-center gap-2 px-4 py-2 bg-amber-50 border-b border-amber-200 text-amber-800 text-xs shrink-0">
            <AlertCircle className="w-3.5 h-3.5 shrink-0" />
            You have <strong>{changedIds.size}</strong> unsaved change{changedIds.size > 1 ? "s" : ""}.{" "}
            Press <kbd className="px-1 py-0.5 bg-amber-100 rounded border border-amber-300 font-mono">Save</kbd> to apply.
          </div>
        )}

        {/* ── Filter Bar ── */}
        {showFilters && (
          <div className="flex items-center gap-3 px-4 py-2 border-b bg-muted/40 shrink-0 flex-wrap">
            <span className="text-xs font-semibold text-muted-foreground flex items-center gap-1">
              <Filter className="w-3 h-3" /> Filters:
            </span>

            {/* Category */}
            <Select value={filterCategory || "__all__"} onValueChange={(v) => { setFilterCategory(v === "__all__" ? "" : v); setPage(1); }}>
              <SelectTrigger className="h-7 text-xs w-44">
                <SelectValue placeholder="All Categories" />
              </SelectTrigger>
              <SelectContent className="max-h-60">
                <SelectItem value="__all__">All Categories</SelectItem>
                {categories.map((c) => <SelectItem key={c._id} value={c._id}>{c.name}</SelectItem>)}
              </SelectContent>
            </Select>

            {/* Section */}
            <Select value={filterSection || "__all__"} onValueChange={(v) => { setFilterSection(v === "__all__" ? "" : v); setPage(1); }}>
              <SelectTrigger className="h-7 text-xs w-44">
                <SelectValue placeholder="All Sections" />
              </SelectTrigger>
              <SelectContent className="max-h-60">
                <SelectItem value="__all__">All Sections</SelectItem>
                {sections.map((s) => <SelectItem key={s._id} value={s._id}>{s.name}</SelectItem>)}
              </SelectContent>
            </Select>

            {/* Status */}
            <Select value={filterStatus || "__all__"} onValueChange={(v) => { setFilterStatus(v === "__all__" ? "" : v); setPage(1); }}>
              <SelectTrigger className="h-7 text-xs w-36">
                <SelectValue placeholder="All Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="__all__">All Status</SelectItem>
                <SelectItem value="active"><span className="text-green-600">Active</span></SelectItem>
                <SelectItem value="inactive"><span className="text-red-500">Inactive</span></SelectItem>
              </SelectContent>
            </Select>

            {/* Offer Tag */}
            <Select value={filterOffer || "__all__"} onValueChange={(v) => { setFilterOffer(v === "__all__" ? "" : v); setPage(1); }}>
              <SelectTrigger className="h-7 text-xs w-40">
                <SelectValue placeholder="All Offer Tags" />
              </SelectTrigger>
              <SelectContent className="max-h-60">
                <SelectItem value="__all__">All Offer Tags</SelectItem>
                {offers.map((o) => (
                  <SelectItem key={o._id} value={o._id}>
                    <span className="flex items-center gap-1.5">
                      {o.color_code && <span className="w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: o.color_code }} />}
                      {o.name}
                    </span>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            {/* Clear filters */}
            {(filterCategory || filterSection || filterStatus || filterOffer) && (
              <Button
                variant="ghost"
                size="sm"
                className="h-7 px-2 text-xs gap-1 text-muted-foreground hover:text-foreground"
                onClick={() => { setFilterCategory(""); setFilterSection(""); setFilterStatus(""); setFilterOffer(""); setPage(1); }}
              >
                <X className="w-3 h-3" /> Clear
              </Button>
            )}
          </div>
        )}

        {/* ── No columns selected ── */}
        {activeCols.length === 0 && !loading && (
          <div className="flex-1 flex flex-col items-center justify-center gap-3 text-muted-foreground">
            <Columns3 className="w-12 h-12 opacity-30" />
            <p className="text-sm">No columns selected. Use <strong>Columns</strong> to pick fields to edit.</p>
            <Button size="sm" onClick={selectAllCols}>Show All Columns</Button>
          </div>
        )}

        {/* ── Spreadsheet ── */}
        {activeCols.length > 0 && (
          <div ref={tableRef} className="flex-1 overflow-auto">
            {loading ? (
              <div className="flex items-center justify-center h-full">
                <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
              </div>
            ) : (
              <table
                className="w-full border-collapse text-sm"
                style={{ minWidth: (activeCols.reduce((s, c) => s + c.width, 0) + 110) + "px" }}
              >
                <thead className="sticky top-0 z-20 bg-muted border-b-2 border-border">
                  <tr>
                    {/* # */}
                    <th className="text-left px-3 py-2 font-semibold text-xs text-muted-foreground w-10 border-r border-border sticky left-0 bg-muted z-30">
                      #
                    </th>
                    {/* Image */}
                    <th className="text-left px-3 py-2 font-semibold text-xs text-muted-foreground w-16 border-r border-border sticky left-10 bg-muted z-30">
                      Img
                    </th>
                    {/* Dynamic columns */}
                    {activeCols.map((col) => {
                      const isTitle = col.key === "title";
                      return (
                        <th
                          key={col.key}
                          className={`text-left px-3 py-2 font-semibold text-xs text-muted-foreground border-r border-border whitespace-nowrap select-none ${
                            isTitle ? "sticky left-[104px] bg-muted z-30 shadow-[1px_0_0_0_rgba(0,0,0,0.1)]" : ""
                          }`}
                          style={{ width: col.width, minWidth: col.width }}
                        >
                          {col.label}
                        </th>
                      );
                    })}
                  </tr>
                </thead>

                <tbody>
                  {rows.length === 0 ? (
                    <tr>
                      <td
                        colSpan={activeCols.length + 2}
                        className="text-center py-16 text-muted-foreground"
                      >
                        No products found
                      </td>
                    </tr>
                  ) : (
                    rows.map((row, rowIdx) => {
                      const isChanged = changedIds.has(row._id);
                      return (
                        <tr
                          key={row._id}
                          className={`border-b border-border transition-colors ${
                            isChanged
                              ? "bg-amber-50 dark:bg-amber-950/20"
                              : rowIdx % 2 === 0
                              ? "bg-background"
                              : "bg-muted/30"
                          } hover:bg-blue-50/40 dark:hover:bg-blue-950/20`}
                        >
                          {/* Row # */}
                          <td className="px-3 py-1 text-xs text-muted-foreground border-r border-border sticky left-0 bg-inherit z-10 w-10">
                            <div className="flex items-center gap-1">
                              {isChanged && (
                                <div className="w-1.5 h-1.5 rounded-full bg-amber-500 shrink-0" title="Modified" />
                              )}
                              {(page - 1) * limit + rowIdx + 1}
                            </div>
                          </td>

                          {/* Image */}
                          <td className="px-2 py-1 border-r border-border sticky left-10 bg-inherit z-10 w-16">
                            {row.image ? (
                              <img
                                src={`${import.meta.env.VITE_API_BASE_URL}/uploads/${row.image}`}
                                alt={row.title}
                                className="w-9 h-9 object-cover rounded border border-border"
                              />
                            ) : (
                              <div className="w-9 h-9 bg-muted rounded border border-border flex items-center justify-center text-[9px] text-muted-foreground">
                                No img
                              </div>
                            )}
                          </td>

                          {/* Dynamic editable cells */}
                          {activeCols.map((col, colIdx) => {
                            const isTitle = col.key === "title";
                            return (
                              <td
                                key={col.key}
                                className={`py-0.5 border-r border-border ${
                                  activeCell?.row === rowIdx && activeCell?.col === col.key
                                    ? "ring-2 ring-inset ring-blue-500 bg-white dark:bg-blue-950/30"
                                    : ""
                                } ${isTitle ? "sticky left-[104px] bg-inherit z-10 shadow-[1px_0_0_0_rgba(0,0,0,0.05)]" : ""}`}
                                style={{ width: col.width, minWidth: col.width }}
                              >
                                {renderCell(row, rowIdx, col, colIdx)}
                              </td>
                            );
                          })}
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            )}
          </div>
        )}

        {/* ── Pagination ── */}
        <div className="flex items-center justify-between px-4 py-2 border-t bg-background shrink-0 text-sm text-muted-foreground">
          <div className="flex items-center gap-6">
            <span>
              Page {page} of {totalPages} · {totalProducts} total products
            </span>
            <div className="flex items-center gap-2">
              <span className="text-xs">Rows per page:</span>
              <Select value={String(limit)} onValueChange={(v) => { setLimit(Number(v)); setPage(1); }}>
                <SelectTrigger className="h-7 w-16 text-xs bg-muted/50 border-none shadow-none">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {[20, 50, 100, 200, 500].map((val) => (
                    <SelectItem key={val} value={String(val)}>{val}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" disabled={page <= 1} onClick={() => setPage((p) => p - 1)}>
              <ChevronLeft className="w-4 h-4" />
            </Button>
            <span className="text-xs px-1 font-medium text-foreground">{page} / {totalPages}</span>
            <Button variant="outline" size="sm" disabled={page >= totalPages} onClick={() => setPage((p) => p + 1)}>
              <ChevronRight className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
};

export default BulkEditProducts;
