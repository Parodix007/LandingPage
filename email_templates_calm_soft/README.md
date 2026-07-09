# calm_soft — form email templates (green theme)

Two Handlebars templates matching the landing page (accent `#7ce38b`), export of designs **2a** and **2b**:

| File | Purpose | Recipient |
|---|---|---|
| `confirmation-client.hbs` + `.txt.hbs` | Form-submission confirmation (design 2a, no CTA button) | the client |
| `inquiry-internal.hbs` + `.txt.hbs` | Inquiry summary with every form field (design 2b) | your team |
| `send-example.js` | End-to-end usage with `nodemailer` + `handlebars` | — |
| `preview/` | Templates rendered with sample data (open in a browser) | — |

## Variables

### confirmation-client
| Variable | Type | Notes |
|---|---|---|
| `firstName` | string | greeting ("Thanks, Anna") |
| `service` | string | display label, e.g. `Web solutions` |
| `meeting` | string | `Online` or `On-site at your office` |
| `discoverWorkshop` | boolean | row shown only when `true` |
| `maintenanceHandover` | boolean | row shown only when `true` |
| `year` | number | footer © |

### inquiry-internal
All of the above plus:
| Variable | Type | Notes |
|---|---|---|
| `name` | string | full name |
| `email` | string | used for the `mailto:` reply button |
| `company` | string | optional — row hidden when empty |
| `phone` | string | optional — row hidden when empty |
| `message` | string | project description; HTML is escaped, `\n` renders as line breaks (`white-space: pre-line`) |
| `submittedAt` | string | e.g. `2026-07-08 14:32` |
| `source` | string | e.g. `calmsoft.com/#contact` |

Booleans in the internal template render as `✓ Yes` (green) / `— No` (gray).

## Usage

```js
const Handlebars = require('handlebars');
const fs = require('fs');

const tpl = Handlebars.compile(fs.readFileSync('email-templates/confirmation-client.hbs', 'utf8'));
const html = tpl({
  firstName: 'Anna',
  service: 'Web solutions',
  meeting: 'Online',
  discoverWorkshop: true,
  maintenanceHandover: true,
  year: new Date().getFullYear(),
});
```

See `send-example.js` for the full flow (service-id → label mapping, `replyTo` set to the sender, suggested subjects).

## Implementation notes

- **Email-safe markup**: table layout, all styles inline, no flexbox/grid.
- **No images**: the logo is styled text (mono font + green underscore) — nothing to host or attach.
- **Colors are solid hex** (pre-blended from the site's rgba/color-mix values) so Outlook renders them correctly. Green accent: `#7ce38b`, card: `#101012`, canvas: `#000000`.
- **Rounded corners** degrade gracefully in Outlook desktop (renders square).
- Suggested subjects:
  - client: `Request received — a senior engineer replies within 24h`
  - internal: `New inquiry: {service} — {name}`
