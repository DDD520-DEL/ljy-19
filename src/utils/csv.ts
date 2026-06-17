import type { Consumption, Restock, Material, User, MaterialCategory } from "@/types";
import { categoryLabels } from "@/types";
import { formatDate } from "./date";

const escapeCSV = (value: string | number | undefined | null): string => {
  if (value === undefined || value === null) return "";
  const str = String(value);
  if (str.includes(",") || str.includes("\"") || str.includes("\n") || str.includes("\r")) {
    return `"${str.replace(/"/g, "\"\"")}"`;
  }
  return str;
};

export interface ConsumptionExportRow {
  时间: string;
  人员: string;
  物料名称: string;
  物料类别: string;
  数量: number;
  单位: string;
  单价: string;
  金额: string;
}

export interface RestockExportRow {
  时间: string;
  操作人员: string;
  物料名称: string;
  物料类别: string;
  数量: number;
  单位: string;
  单价: string;
  总金额: string;
}

const getFileName = (type: "consumption" | "restock"): string => {
  const now = new Date();
  const timestamp = formatDate(now, "YYYYMMDD_HHmmss");
  const typeName = type === "consumption" ? "消费记录" : "补货记录";
  return `${typeName}_${timestamp}.csv`;
};

const downloadCSV = (content: string, filename: string) => {
  const BOM = "\uFEFF";
  const blob = new Blob([BOM + content], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
};

export const exportConsumptionsToCSV = (
  consumptions: Consumption[],
  materials: Material[],
  users: User[]
): void => {
  const headers = ["时间", "人员", "物料名称", "物料类别", "数量", "单位", "单价", "金额"];

  const rows: string[] = [headers.join(",")];

  consumptions.forEach((c) => {
    const user = users.find((u) => u.id === c.userId);
    const material = materials.find((m) => m.id === c.materialId);
    const unitPrice = material?.unitPrice || 0;
    const amount = c.quantity * unitPrice;
    const category = material?.category
      ? categoryLabels[material.category as MaterialCategory]
      : "";

    const row = [
      formatDate(c.timestamp, "YYYY-MM-DD HH:mm"),
      user?.name || "未知用户",
      material?.name || "未知物料",
      category,
      c.quantity,
      material?.unit || "",
      `¥${unitPrice.toFixed(2)}`,
      `¥${amount.toFixed(2)}`,
    ].map(escapeCSV);

    rows.push(row.join(","));
  });

  const totalAmount = consumptions.reduce((sum, c) => {
    const material = materials.find((m) => m.id === c.materialId);
    return sum + c.quantity * (material?.unitPrice || 0);
  }, 0);

  const summaryRow = [
    "合计",
    "",
    "",
    "",
    consumptions.reduce((sum, c) => sum + c.quantity, 0),
    "",
    "",
    `¥${totalAmount.toFixed(2)}`,
  ].map(escapeCSV);
  rows.push(summaryRow.join(","));

  downloadCSV(rows.join("\r\n"), getFileName("consumption"));
};

export const exportRestocksToCSV = (
  restocks: Restock[],
  materials: Material[],
  users: User[]
): void => {
  const headers = ["时间", "操作人员", "物料名称", "物料类别", "数量", "单位", "单价", "总金额"];

  const rows: string[] = [headers.join(",")];

  restocks.forEach((r) => {
    const operator = users.find((u) => u.id === r.operatorId);
    const material = materials.find((m) => m.id === r.materialId);
    const unitPrice = r.quantity > 0 ? r.cost / r.quantity : 0;
    const category = material?.category
      ? categoryLabels[material.category as MaterialCategory]
      : "";

    const row = [
      formatDate(r.timestamp, "YYYY-MM-DD HH:mm"),
      operator?.name || "未知用户",
      material?.name || "未知物料",
      category,
      r.quantity,
      material?.unit || "",
      `¥${unitPrice.toFixed(2)}`,
      `¥${r.cost.toFixed(2)}`,
    ].map(escapeCSV);

    rows.push(row.join(","));
  });

  const totalQuantity = restocks.reduce((sum, r) => sum + r.quantity, 0);
  const totalCost = restocks.reduce((sum, r) => sum + r.cost, 0);

  const summaryRow = [
    "合计",
    "",
    "",
    "",
    totalQuantity,
    "",
    "",
    `¥${totalCost.toFixed(2)}`,
  ].map(escapeCSV);
  rows.push(summaryRow.join(","));

  downloadCSV(rows.join("\r\n"), getFileName("restock"));
};
