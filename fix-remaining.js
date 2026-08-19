const fs = require("fs");

const files = [
  "apps/web/src/app/dashboard/billing/page.tsx",
  "apps/web/src/app/dashboard/sites/new/page.tsx",
  "apps/web/src/app/dashboard/sites/page.tsx",
  "apps/web/src/app/dashboard/users/page.tsx",
];

for (const file of files) {
  let c = fs.readFileSync(file, "utf8");
  
  // Fix 1: Missing </div> before ); in map return statements
  // Pattern: "...content...\n    );\n\n          })}"  
  // Should be: "...content...\n      </div>\n    );\n\n          })}"
  c = c.replace(/(\S.*\S)\s*\n\s+\)\s*;\s*\n\s*\n\s+\)\)\}/g, "$1\n      </div>\n    );\n\n          })}");
  
  // Fix 2: Missing </div> before </main>
  c = c.replace(/(\S)\s*\n\s+<\/main>/g, "$1\n          </div>\n      </main>");
  
  // Fix 3: Clean any remaining `n artifacts  
  c = c.replace(/`}n/g, "`}");
  
  // Fix 4: Remove corrupted style blocks
  c = c.replace(/\n\s*<style jsx global>\{`[^`]*n[^`]*`\}<\/style>/g, "");
  c = c.replace(/\n\s*<style jsx global>\{`[^`]*`\}<\/style>/g, "");
  
  // Ensure clean ending
  if (c.includes("</main>")) {
    c = c.replace(/<\/main>\s*\n\s*\)\s*;\s*\n\s*\}$/, "</main>\n    );\n}");
  }
  
  fs.writeFileSync(file, c, "utf8");
  console.log("Fixed:", file);
}
