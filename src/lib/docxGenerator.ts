import {
  Document,
  Paragraph,
  TextRun,
  Table,
  TableRow,
  TableCell,
  HeadingLevel,
  WidthType,
  BorderStyle,
  AlignmentType,
  Packer,
} from "docx";
import { saveAs } from "file-saver";

/**
 * Parse markdown-style content into docx paragraphs and tables.
 */
function parseMarkdownToDocxElements(title: string, markdown: string) {
  const elements: (Paragraph | Table)[] = [];

  // Title
  elements.push(
    new Paragraph({
      heading: HeadingLevel.TITLE,
      spacing: { after: 300 },
      children: [new TextRun({ text: title, bold: true, size: 32, font: "Calibri" })],
    })
  );

  const lines = markdown.split("\n");
  let i = 0;

  while (i < lines.length) {
    const line = lines[i];

    // Skip empty lines
    if (line.trim() === "") {
      i++;
      continue;
    }

    // Check if this is the start of a markdown table
    if (line.trim().startsWith("|") && i + 1 < lines.length && lines[i + 1]?.trim().match(/^\|[\s\-:|]+\|/)) {
      const tableLines: string[] = [];
      while (i < lines.length && lines[i].trim().startsWith("|")) {
        tableLines.push(lines[i].trim());
        i++;
      }
      const table = parseTable(tableLines);
      if (table) elements.push(table);
      continue;
    }

    // Headings
    if (line.startsWith("### ")) {
      elements.push(
        new Paragraph({
          heading: HeadingLevel.HEADING_3,
          spacing: { before: 240, after: 120 },
          children: [new TextRun({ text: cleanInlineMarkdown(line.slice(4)), bold: true, size: 24, font: "Calibri" })],
        })
      );
    } else if (line.startsWith("## ")) {
      elements.push(
        new Paragraph({
          heading: HeadingLevel.HEADING_2,
          spacing: { before: 300, after: 120 },
          children: [new TextRun({ text: cleanInlineMarkdown(line.slice(3)), bold: true, size: 28, font: "Calibri" })],
        })
      );
    } else if (line.startsWith("# ")) {
      elements.push(
        new Paragraph({
          heading: HeadingLevel.HEADING_1,
          spacing: { before: 360, after: 160 },
          children: [new TextRun({ text: cleanInlineMarkdown(line.slice(2)), bold: true, size: 32, font: "Calibri" })],
        })
      );
    }
    // Bullet points
    else if (line.match(/^[-•*]\s/)) {
      elements.push(
        new Paragraph({
          bullet: { level: 0 },
          spacing: { after: 60 },
          children: parseInlineFormatting(line.replace(/^[-•*]\s/, "").trim()),
        })
      );
    }
    // Numbered list
    else if (line.match(/^\d+\.\s/)) {
      elements.push(
        new Paragraph({
          spacing: { after: 60 },
          children: parseInlineFormatting(line.trim()),
        })
      );
    }
    // Blockquote
    else if (line.startsWith("> ")) {
      elements.push(
        new Paragraph({
          spacing: { before: 120, after: 120 },
          indent: { left: 720 },
          children: [new TextRun({ text: line.slice(2), italics: true, size: 22, font: "Calibri", color: "666666" })],
        })
      );
    }
    // Horizontal rule
    else if (line.match(/^---+$/)) {
      elements.push(
        new Paragraph({
          spacing: { before: 200, after: 200 },
          border: { bottom: { style: BorderStyle.SINGLE, size: 1, color: "CCCCCC" } },
          children: [new TextRun({ text: "" })],
        })
      );
    }
    // Regular paragraph
    else {
      elements.push(
        new Paragraph({
          spacing: { after: 100 },
          children: parseInlineFormatting(line.trim()),
        })
      );
    }

    i++;
  }

  return elements;
}

function cleanInlineMarkdown(text: string): string {
  return text.replace(/\*\*(.*?)\*\*/g, "$1").replace(/\*(.*?)\*/g, "$1").replace(/`(.*?)`/g, "$1");
}

function parseInlineFormatting(text: string): TextRun[] {
  const runs: TextRun[] = [];
  const regex = /\*\*(.*?)\*\*|`(.*?)`|\*(.*?)\*/g;
  let lastIndex = 0;
  let match;

  while ((match = regex.exec(text)) !== null) {
    if (match.index > lastIndex) {
      runs.push(new TextRun({ text: text.slice(lastIndex, match.index), size: 22, font: "Calibri" }));
    }
    if (match[1] !== undefined) {
      runs.push(new TextRun({ text: match[1], bold: true, size: 22, font: "Calibri" }));
    } else if (match[2] !== undefined) {
      runs.push(new TextRun({ text: match[2], size: 22, font: "Consolas", color: "555555" }));
    } else if (match[3] !== undefined) {
      runs.push(new TextRun({ text: match[3], italics: true, size: 22, font: "Calibri" }));
    }
    lastIndex = match.index + match[0].length;
  }

  if (lastIndex < text.length) {
    runs.push(new TextRun({ text: text.slice(lastIndex), size: 22, font: "Calibri" }));
  }

  if (runs.length === 0) {
    runs.push(new TextRun({ text, size: 22, font: "Calibri" }));
  }

  return runs;
}

function parseTable(tableLines: string[]): Table | null {
  if (tableLines.length < 2) return null;

  const parseRow = (line: string) =>
    line
      .split("|")
      .map((c) => c.trim())
      .filter((c) => c.length > 0 && !c.match(/^[-:]+$/));

  const headerCells = parseRow(tableLines[0]);
  // Skip separator line (index 1)
  const dataRows = tableLines.slice(2).map(parseRow);

  if (headerCells.length === 0) return null;

  const cellWidth = Math.floor(9000 / headerCells.length);

  const headerRow = new TableRow({
    tableHeader: true,
    children: headerCells.map(
      (cell) =>
        new TableCell({
          width: { size: cellWidth, type: WidthType.DXA },
          shading: { fill: "2B2D42", color: "FFFFFF" },
          children: [
            new Paragraph({
              alignment: AlignmentType.LEFT,
              spacing: { before: 40, after: 40 },
              children: [new TextRun({ text: cleanInlineMarkdown(cell), bold: true, size: 20, font: "Calibri", color: "FFFFFF" })],
            }),
          ],
        })
    ),
  });

  const bodyRows = dataRows.map(
    (row, rowIdx) =>
      new TableRow({
        children: headerCells.map(
          (_, colIdx) =>
            new TableCell({
              width: { size: cellWidth, type: WidthType.DXA },
              shading: rowIdx % 2 === 0 ? { fill: "F8F9FA" } : undefined,
              children: [
                new Paragraph({
                  alignment: AlignmentType.LEFT,
                  spacing: { before: 30, after: 30 },
                  children: [new TextRun({ text: cleanInlineMarkdown(row[colIdx] || ""), size: 20, font: "Calibri" })],
                }),
              ],
            })
        ),
      })
  );

  return new Table({
    width: { size: 9000, type: WidthType.DXA },
    rows: [headerRow, ...bodyRows],
  });
}

export async function generateAndDownloadDocx(title: string, prompt: string) {
  const elements = parseMarkdownToDocxElements(title, prompt);

  const doc = new Document({
    sections: [
      {
        properties: {
          page: {
            margin: { top: 1440, right: 1440, bottom: 1440, left: 1440 },
          },
        },
        children: elements,
      },
    ],
  });

  const blob = await Packer.toBlob(doc);
  const filename = title.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/-+$/, "") + ".docx";
  saveAs(blob, filename);
}
