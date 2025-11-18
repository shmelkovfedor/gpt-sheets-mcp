import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { z } from "zod";
import { google } from "googleapis";

const serviceAccount = JSON.parse(process.env.GOOGLE_CREDENTIALS);

const SCOPES = ["https://www.googleapis.com/auth/spreadsheets.readonly"];

const auth = new google.auth.JWT({
  email: serviceAccount.client_email,
  key: serviceAccount.private_key,
  scopes: SCOPES,
});

const sheets = google.sheets({ version: "v4", auth });

const server = new Server({
  name: "gpt-sheets-mcp",
  version: "1.0.0",
});

/**
 * Пример инструмента: Прочитать диапазон из Google Sheets
 */
server.tool(
  "get_sheet_range",
  {
    spreadsheetId: z.string(),
    range: z.string()
  },
  async ({ spreadsheetId, range }) => {
    const res = await sheets.spreadsheets.values.get({
      spreadsheetId,
      range
    });

    return {
      values: res.data.values || []
    };
  }
);

server.start();
