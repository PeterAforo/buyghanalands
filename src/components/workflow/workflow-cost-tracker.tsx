"use client";

import * as React from "react";
import { cn } from "@/lib/utils";
import {
  DollarSign,
  TrendingUp,
  TrendingDown,
  Plus,
  Edit2,
  Trash2,
  Download,
  PieChart,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

interface CostItem {
  id: string;
  category: string;
  description: string;
  budgetAmount: number;
  actualAmount: number;
  paidDate?: Date;
  receiptUrl?: string;
  notes?: string;
}

interface CostCategory {
  name: string;
  budgetTotal: number;
  actualTotal: number;
  items: CostItem[];
}

interface WorkflowCostTrackerProps {
  categories: CostCategory[];
  currency?: string;
  onAddItem?: (category: string, item: Omit<CostItem, "id">) => void;
  onEditItem?: (itemId: string, updates: Partial<CostItem>) => void;
  onDeleteItem?: (itemId: string) => void;
  onExport?: (format: "pdf" | "excel") => void;
  className?: string;
}

function formatCurrency(amount: number, currency: string = "GHS"): string {
  return `${currency} ${amount.toLocaleString("en-GH", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;
}

function WorkflowCostTracker({
  categories,
  currency = "GHS",
  onAddItem,
  onEditItem,
  onDeleteItem,
  onExport,
  className,
}: WorkflowCostTrackerProps) {
  const [expandedCategories, setExpandedCategories] = React.useState<Set<string>>(
    new Set(categories.map((c) => c.name))
  );
  const [showAddModal, setShowAddModal] = React.useState(false);
  const [addCategory, setAddCategory] = React.useState("");
  const [newItem, setNewItem] = React.useState({
    description: "",
    budgetAmount: 0,
    actualAmount: 0,
    notes: "",
  });

  // Calculate totals
  const totalBudget = categories.reduce((sum, cat) => sum + cat.budgetTotal, 0);
  const totalActual = categories.reduce((sum, cat) => sum + cat.actualTotal, 0);
  const variance = totalBudget - totalActual;
  const variancePercent = totalBudget > 0 ? ((variance / totalBudget) * 100).toFixed(1) : 0;

  const toggleCategory = (categoryName: string) => {
    setExpandedCategories((prev) => {
      const next = new Set(prev);
      if (next.has(categoryName)) {
        next.delete(categoryName);
      } else {
        next.add(categoryName);
      }
      return next;
    });
  };

  const handleAddItem = () => {
    if (onAddItem && addCategory && newItem.description) {
      onAddItem(addCategory, {
        category: addCategory,
        description: newItem.description,
        budgetAmount: newItem.budgetAmount,
        actualAmount: newItem.actualAmount,
        notes: newItem.notes,
      });
      setShowAddModal(false);
      setNewItem({ description: "", budgetAmount: 0, actualAmount: 0, notes: "" });
      setAddCategory("");
    }
  };

  return (
    <div className={cn("bg-white rounded-xl border border-gray-200", className)}>
      {/* Header */}
      <div className="p-4 border-b border-gray-100">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-lg font-semibold text-gray-900">Cost Tracker</h3>
            <p className="text-sm text-gray-500">Track your budget vs actual expenses</p>
          </div>
          <div className="flex items-center gap-2">
            {onExport && (
              <Button variant="outline" size="sm" onClick={() => onExport("excel")}>
                <Download className="h-4 w-4 mr-1" />
                Export
              </Button>
            )}
            {onAddItem && (
              <Button size="sm" onClick={() => setShowAddModal(true)}>
                <Plus className="h-4 w-4 mr-1" />
                Add Cost
              </Button>
            )}
          </div>
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-3 gap-4">
          <div className="p-4 bg-blue-50 rounded-lg">
            <p className="text-xs font-medium text-blue-600 uppercase">Total Budget</p>
            <p className="text-xl font-bold text-blue-700 mt-1">
              {formatCurrency(totalBudget, currency)}
            </p>
          </div>
          <div className="p-4 bg-amber-50 rounded-lg">
            <p className="text-xs font-medium text-amber-600 uppercase">Total Spent</p>
            <p className="text-xl font-bold text-amber-700 mt-1">
              {formatCurrency(totalActual, currency)}
            </p>
          </div>
          <div
            className={cn(
              "p-4 rounded-lg",
              variance >= 0 ? "bg-green-50" : "bg-red-50"
            )}
          >
            <p
              className={cn(
                "text-xs font-medium uppercase",
                variance >= 0 ? "text-green-600" : "text-red-600"
              )}
            >
              {variance >= 0 ? "Under Budget" : "Over Budget"}
            </p>
            <div className="flex items-center gap-2 mt-1">
              <p
                className={cn(
                  "text-xl font-bold",
                  variance >= 0 ? "text-green-700" : "text-red-700"
                )}
              >
                {formatCurrency(Math.abs(variance), currency)}
              </p>
              <span
                className={cn(
                  "flex items-center text-sm",
                  variance >= 0 ? "text-green-600" : "text-red-600"
                )}
              >
                {variance >= 0 ? (
                  <TrendingDown className="h-4 w-4" />
                ) : (
                  <TrendingUp className="h-4 w-4" />
                )}
                {variancePercent}%
              </span>
            </div>
          </div>
        </div>

        {/* Progress Bar */}
        <div className="mt-4">
          <div className="flex items-center justify-between text-xs text-gray-500 mb-1">
            <span>Budget Utilization</span>
            <span>
              {totalBudget > 0
                ? Math.min(100, Math.round((totalActual / totalBudget) * 100))
                : 0}
              %
            </span>
          </div>
          <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
            <div
              className={cn(
                "h-full rounded-full transition-all duration-500",
                totalActual <= totalBudget ? "bg-green-500" : "bg-red-500"
              )}
              style={{
                width: `${Math.min(100, totalBudget > 0 ? (totalActual / totalBudget) * 100 : 0)}%`,
              }}
            />
          </div>
        </div>
      </div>

      {/* Categories */}
      <div className="divide-y divide-gray-100">
        {categories.map((category) => {
          const isExpanded = expandedCategories.has(category.name);
          const categoryVariance = category.budgetTotal - category.actualTotal;
          const utilizationPercent =
            category.budgetTotal > 0
              ? Math.round((category.actualTotal / category.budgetTotal) * 100)
              : 0;

          return (
            <div key={category.name}>
              {/* Category Header */}
              <button
                onClick={() => toggleCategory(category.name)}
                className="w-full flex items-center justify-between p-4 hover:bg-gray-50 transition-colors"
              >
                <div className="flex items-center gap-3">
                  <div
                    className={cn(
                      "w-8 h-8 rounded-lg flex items-center justify-center",
                      categoryVariance >= 0 ? "bg-green-100" : "bg-red-100"
                    )}
                  >
                    <DollarSign
                      className={cn(
                        "h-4 w-4",
                        categoryVariance >= 0 ? "text-green-600" : "text-red-600"
                      )}
                    />
                  </div>
                  <div className="text-left">
                    <p className="font-medium text-gray-900">{category.name}</p>
                    <p className="text-xs text-gray-500">
                      {category.items.length} items • {utilizationPercent}% utilized
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-6">
                  <div className="text-right">
                    <p className="text-sm text-gray-500">Budget</p>
                    <p className="font-medium text-gray-900">
                      {formatCurrency(category.budgetTotal, currency)}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm text-gray-500">Actual</p>
                    <p className="font-medium text-gray-900">
                      {formatCurrency(category.actualTotal, currency)}
                    </p>
                  </div>
                  <div className="text-right min-w-[100px]">
                    <p className="text-sm text-gray-500">Variance</p>
                    <p
                      className={cn(
                        "font-medium",
                        categoryVariance >= 0 ? "text-green-600" : "text-red-600"
                      )}
                    >
                      {categoryVariance >= 0 ? "-" : "+"}
                      {formatCurrency(Math.abs(categoryVariance), currency)}
                    </p>
                  </div>
                </div>
              </button>

              {/* Category Items */}
              {isExpanded && category.items.length > 0 && (
                <div className="bg-gray-50 px-4 pb-4">
                  <table className="w-full">
                    <thead>
                      <tr className="text-xs text-gray-500 uppercase">
                        <th className="text-left py-2 font-medium">Description</th>
                        <th className="text-right py-2 font-medium">Budget</th>
                        <th className="text-right py-2 font-medium">Actual</th>
                        <th className="text-right py-2 font-medium">Variance</th>
                        {(onEditItem || onDeleteItem) && (
                          <th className="text-right py-2 font-medium w-20">Actions</th>
                        )}
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                      {category.items.map((item) => {
                        const itemVariance = item.budgetAmount - item.actualAmount;
                        return (
                          <tr key={item.id} className="text-sm">
                            <td className="py-2">
                              <p className="text-gray-900">{item.description}</p>
                              {item.notes && (
                                <p className="text-xs text-gray-500">{item.notes}</p>
                              )}
                            </td>
                            <td className="text-right py-2 text-gray-700">
                              {formatCurrency(item.budgetAmount, currency)}
                            </td>
                            <td className="text-right py-2 text-gray-700">
                              {formatCurrency(item.actualAmount, currency)}
                            </td>
                            <td
                              className={cn(
                                "text-right py-2",
                                itemVariance >= 0 ? "text-green-600" : "text-red-600"
                              )}
                            >
                              {itemVariance >= 0 ? "-" : "+"}
                              {formatCurrency(Math.abs(itemVariance), currency)}
                            </td>
                            {(onEditItem || onDeleteItem) && (
                              <td className="text-right py-2">
                                <div className="flex items-center justify-end gap-1">
                                  {onEditItem && (
                                    <button
                                      onClick={() => {}}
                                      className="p-1 text-gray-400 hover:text-gray-600"
                                    >
                                      <Edit2 className="h-4 w-4" />
                                    </button>
                                  )}
                                  {onDeleteItem && (
                                    <button
                                      onClick={() => onDeleteItem(item.id)}
                                      className="p-1 text-gray-400 hover:text-red-600"
                                    >
                                      <Trash2 className="h-4 w-4" />
                                    </button>
                                  )}
                                </div>
                              </td>
                            )}
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Add Cost Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="bg-white rounded-xl w-full max-w-md p-6 m-4">
            <h3 className="text-lg font-semibold mb-4">Add Cost Item</h3>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Category
                </label>
                <select
                  value={addCategory}
                  onChange={(e) => setAddCategory(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                >
                  <option value="">Select category...</option>
                  {categories.map((cat) => (
                    <option key={cat.name} value={cat.name}>
                      {cat.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Description
                </label>
                <Input
                  value={newItem.description}
                  onChange={(e) =>
                    setNewItem({ ...newItem, description: e.target.value })
                  }
                  placeholder="e.g., Legal consultation fee"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Budget Amount ({currency})
                  </label>
                  <Input
                    type="number"
                    value={newItem.budgetAmount || ""}
                    onChange={(e) =>
                      setNewItem({ ...newItem, budgetAmount: Number(e.target.value) })
                    }
                    placeholder="0.00"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Actual Amount ({currency})
                  </label>
                  <Input
                    type="number"
                    value={newItem.actualAmount || ""}
                    onChange={(e) =>
                      setNewItem({ ...newItem, actualAmount: Number(e.target.value) })
                    }
                    placeholder="0.00"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Notes (Optional)
                </label>
                <Input
                  value={newItem.notes}
                  onChange={(e) => setNewItem({ ...newItem, notes: e.target.value })}
                  placeholder="Additional notes..."
                />
              </div>
            </div>

            <div className="flex justify-end gap-2 mt-6">
              <Button variant="outline" onClick={() => setShowAddModal(false)}>
                Cancel
              </Button>
              <Button onClick={handleAddItem} disabled={!addCategory || !newItem.description}>
                Add Cost
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export { WorkflowCostTracker };
export type { CostItem, CostCategory };
