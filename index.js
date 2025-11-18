import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { ListToolsResponseSchema } from "@modelcontextprotocol/sdk/types.js";
import { google } from "googleapis";
import fs from "fs";

const CREDENTIALS_PATH = "./credentials.json";

function getSheetsClient() {
  const creds = JSON.parse(fs.readFileSync(CREDENTIALS_PATH, "utf8"));
  const auth = new google.auth.GoogleAuth({
    credentials: creds,
    scopes: ["https://www.googleapis.com/auth/spreadsheets.readonly"],
  });
  return google.sheets({ version: "v4", auth });
}

const server = new Server({
  name: "gpt-sheets-mcp",
  version: "1.0.0",
});

server.setRequestHandler("tools/list", async () => {
  return ListToolsResponseSchema.parse({
    tools: [
      {
        name: "read_sheet",
        description: "Прочитать данные из Google Sheets",
        inputSchema: {
          type: "object",
          properties: {
            spreadsheetId: { type: "string" },
            range: { type: "string" }
          },
          required: ["spreadsheetId", "range"]
        }
      }
    ]
  });
});

server.setRequestHandler("tools/call", async (req) => {
  if (req.params.name !== "read_sheet") return;

  const { spreadsheetId, range } = req.params.arguments;

  try {
    const sheets = getSheetsClient();
    const res = await sheets.spreadsheets.values.get({
      spreadsheetId,
      range
    });

    return {
      content: [
        { type: "text", text: JSON.stringify(res.data.values, null, 2) }
      ]
    };
  } catch (err) {
    return {
      content: [
        { type: "text", text: `ERROR: ${err.message}` }
      ]
    };
  }
});

server.start();
