const fs = require("fs");
const path = require("path");

const files = [
  "src/app/dashboard/sites/page.tsx",
  "src/app/dashboard/users/page.tsx",
  "src/app/dashboard/analytics/page.tsx",
  "src/app/dashboard/leads/page.tsx",
  "src/app/dashboard/forms/page.tsx",
  "src/app/dashboard/whatsapp/page.tsx",
  "src/app/dashboard/billing/page.tsx",
  "src/app/dashboard/support/page.tsx",
  "src/app/dashboard/ai/page.tsx",
  "src/app/dashboard/ecommerce/page.tsx",
  "src/app/dashboard/bookings-page/page.tsx",
  "src/app/dashboard/seo/page.tsx",
  "src/app/dashboard/settings/page.tsx",
  "src/app/dashboard/integrations/page.tsx",
  "src/app/dashboard/api-keys/page.tsx",
  "src/app/dashboard/automations/page.tsx",
  "src/app/dashboard/audit/page.tsx",
  "src/app/dashboard/webhooks/page.tsx",
  "src/app/dashboard/new-tenant/page.tsx",
  "src/app/dashboard/media/page.tsx",
  "src/app/dashboard/page.tsx",
];

const baseDir = path.join(__dirname, "apps", "web");

for (const file of files) {
  const fullPath = path.join(baseDir, file);
  if (!fs.existsSync(fullPath)) continue;

  let content = fs.readFileSync(fullPath, "utf8");

  // Fix 1: Remove leftover </div> before closing )
  content = content.replace(/\s*<\/div>\s*\n?\s*\)\s*;?\s*$/gm, "\n    );\n");

  // Fix 2: Remove empty <div></div> blocks  
  content = content.replace(/\s*<div>\s*<\/div>\s*/g, "\n");

  // Fix 3: Fix the return comment issue in page.tsx
  content = content.replace(/return\s*\(\s*\n\s*\{\/\*\s*Main\s*\*\/\}\s*\n/, "return (\n");

  fs.writeFileSync(fullPath, content, "utf8");
}

console.log("Fixed leftover divs");
