/*
 * Developer documentation shown in the page help drawer, keyed by page.
 * Source of truth: the "Agenda columns – developer backlog" doc
 * (https://claude.ai/artifact/1eFEFkuYPFyh3f9UQF4XX5). Keep both in sync.
 * `**text**` renders bold.
 */

export const PAGE_DOCS = {
  "meeting/agenda-columns": {
    title: "Agenda columns",
    path: "Care unit manager › Meeting › Agenda columns",
    fullDoc: "https://claude.ai/artifact/1eFEFkuYPFyh3f9UQF4XX5",
    overview: [
      "Care unit admins choose up to 9 request-form fields to show as extra columns on the MDT meeting agenda, after the fixed system columns.",
      "**Who:** the care unit admin configures; clinicians and MDT members see the result on the meeting agenda.",
      "**Why:** each care unit sees the case details that matter to its meeting (e.g. organ type, urgency) without opening every case.",
    ],
    scope: {
      in: "Viewing, adding, removing and reordering agenda columns; the agenda preview; fields removed from the request form; the request form version review.",
      out: "Meeting dates and Video conferencing (placeholders), the meeting agenda page itself, column widths, sorting and filtering on the agenda.",
    },
    rules: [
      ["System columns", "9 fixed columns, always first, not configurable: #, Patient, Discussion type, Organisation, Status, Modified, Publishing, Treating clinician, Referrer."],
      ["Additional columns", "0–9 columns per care unit, in a set order, shown after the system columns."],
      ["Source of fields", "Only fields of the care unit's active request form questionnaire."],
      ["Eligible types", "Choice, String, Date, Numeric, Check-box. Text area is listed as \"Not supported – too long for a column\"."],
      ["Field identity", "A column links to the field's stable key, not its label. A label change updates the column name."],
      ["Removed field", "A column whose field is no longer on the active request form is hidden on the agenda and flagged until removed."],
      ["Version review", "Agenda columns are an affected item in the request form version review, like output forms. The new version goes live only after all affected items are reviewed."],
      ["Missing value", "A case with no value for a column shows \"—\"."],
    ],
    epics: [
      {
        title: "Epic 1 – View configured agenda columns",
        stories: [
          {
            title: "1.1 Navigate to agenda columns",
            story: "As a care unit admin, I want to find the agenda column settings under the Meeting tab, so that meeting settings sit together.",
            ac: [
              "**Given** I open a care unit, **then** the top tabs are Basic information, Forms, Meeting and Members.",
              "**Given** I open Meeting, **then** the sub-tabs are Meeting dates, Video conferencing and Agenda columns, with Meeting dates selected.",
              "**Given** agenda columns need review, **then** the Agenda columns sub-tab shows an amber dot.",
            ],
          },
          {
            title: "1.2 See the configured columns",
            story: "As a care unit admin, I want to see which extra columns the agenda shows, so that I know what clinicians see.",
            ac: [
              "**Then** the card AGENDA COLUMNS shows the status \"Up to date\" and \"Fields from <active request form>\".",
              "**Then** a progress bar reads \"<n> of 9 additional columns\".",
              "**Then** each column is a row with its number, field label and type tag, plus an Edit button on the card.",
            ],
          },
          {
            title: "1.3 See the system columns",
            story: "As a care unit admin, I want to know which columns are always on the agenda, so that I don't add duplicates.",
            ac: [
              "**Then** a collapsed row reads \"System columns · always shown (9)\".",
              "**When** I expand it, **then** I see the 9 system column names in order.",
            ],
          },
        ],
      },
      {
        title: "Epic 2 – Edit agenda columns",
        stories: [
          {
            title: "2.1 Enter and leave edit mode",
            story: "As a care unit admin, I want to change the columns in a safe draft, so that nothing changes on the agenda until I save.",
            ac: [
              "**When** I click Edit, **then** the card gets a primary border, the status reads \"Editing\" and the subtitle adds \"· drag to reorder\".",
              "**Then** Cancel and Save columns appear; the preview header shows \"Unsaved changes\".",
              "**When** I click Cancel, **then** all draft changes are discarded.",
              "**When** I click Save columns, **then** the draft becomes the configuration and the status is \"Up to date\".",
            ],
          },
          {
            title: "2.2 Add a column",
            story: "As a care unit admin, I want to add a request-form field as a column, so that clinicians see it on the agenda.",
            ac: [
              "**When** I click Add column, **then** a picker opens with a search box and the eligible fields not yet used, each with its type tag.",
              "**When** I search, **then** the list filters by label; with no match it shows \"No matching fields.\"",
              "**Then** Text area fields sit in a disabled \"Not supported\" group with the reason.",
              "**When** I pick a field, **then** it is added at the end with a \"New\" tag and is outlined in the preview.",
              "**Given** 9 columns, **then** the button reads \"Maximum of 9 columns reached\" and is disabled.",
            ],
          },
          {
            title: "2.3 Remove a column",
            story: "As a care unit admin, I want to remove a column I no longer need.",
            ac: [
              "**When** I click ×, **then** the row is removed, the rest renumber and the preview updates.",
              "**Then** the field is available in the picker again.",
            ],
          },
          {
            title: "2.4 Reorder columns",
            story: "As a care unit admin, I want to set the column order, so that the most important information comes first.",
            ac: [
              "**When** I drag a row by its handle, **then** it moves, numbers update and the preview follows.",
              "**Then** the handle is a button labelled \"Reorder <field>\"; the order can also be changed with the keyboard.",
              "**Then** dragging starts only from the handle.",
            ],
          },
        ],
      },
      {
        title: "Epic 3 – Agenda preview",
        stories: [
          {
            title: "3.1 Preview the agenda with my columns",
            story: "As a care unit admin, I want to see how the agenda will look, so that I can judge my configuration.",
            ac: [
              "**Then** a PREVIEW card shows the agenda with sample cases, grouped by hospital; groups collapse and expand.",
              "**Then** each row shows the number and patient cell (sex icon, NAME, ID, date of birth).",
              "**Then** additional columns follow the system columns with highlighted header and cells; empty values show \"—\".",
            ],
          },
          {
            title: "3.2 Additional columns vs full agenda",
            story: "As a care unit admin, I want to focus on my columns or see the whole agenda.",
            ac: [
              "**Then** a toggle offers \"Additional columns\" (default) and \"Full agenda\".",
              "**Given** Additional columns, **then** 7 system columns collapse into \"+ 7 system columns\".",
              "**Given** Full agenda, **then** all 9 system columns show, including discussion type tags.",
            ],
          },
          {
            title: "3.3 Preview follows edits live",
            story: "As a care unit admin, I want the preview to update while I edit, so that I see the effect before saving.",
            ac: [
              "**When** I add, remove or reorder, **then** the preview updates immediately; new columns are outlined with a dashed border.",
              "**Then** a hint above the table explains the state (sample data / unsaved changes / review).",
              "**Then** on narrow screens the table scrolls horizontally inside its card.",
            ],
          },
        ],
      },
      {
        title: "Epic 4 – Removed fields and form version changes",
        stories: [
          {
            title: "4.1 Flag a column whose field was removed",
            story: "As a care unit admin, I want to see when a column points to a field that no longer exists, so that I can clean it up.",
            ac: [
              "**Then** the status is \"Needs review\" and an amber notice says the column is already hidden on the agenda.",
              "**Then** the row has a light red background, red left bar, struck-through grey label, no number and its type tag.",
              "**Then** a red alert icon shows a tooltip (hover and focus) explaining the form changed and how to delete the column.",
              "**Then** the progress reads \"<kept> of 9 in use · <n> removed\"; the column is not in the preview.",
            ],
          },
          {
            title: "4.2 Remove removed-field columns",
            story: "As a care unit admin, I want to remove those columns in one step.",
            ac: [
              "**When** I click \"Remove <n> removed field(s)\", **then** they are deleted and the status returns to \"Up to date\".",
              "**Given** edit mode, **then** the row keeps its number (red), type tag and red styling, without icon or tooltip; I can remove it with × and save.",
              "**Then** a removed field is never offered in the picker.",
            ],
          },
          {
            title: "4.3 Agenda columns in the version review",
            story: "As a care unit admin, I want agenda columns checked when I switch request form version, so that the agenda never points to fields that disappear.",
            ac: [
              "**Given** I change the request form version, **then** the impact dialog lists \"Meeting agenda columns\" with the removed fields, or \"Not affected\".",
              "**When** I start the review, **then** the card shows \"Needs review\" and \"The request form is changing (v<old> → v<new>)\".",
              "**Then** affected rows use the removed-field style; the preview shows them struck through in red.",
              "**Then** the current version and the agenda stay unchanged until confirmed.",
            ],
          },
          {
            title: "4.4 Confirm the agenda review",
            story: "As a care unit admin, I want to confirm the review so that the new form version can go live.",
            ac: [
              "**When** I click \"Remove <n> column(s) and confirm\", **then** they are deleted and the card shows the new version.",
              "**Given** output forms are still in review, **then** a toast says how many remain.",
              "**Given** it was the last item, **then** the new version becomes active: \"<version> is now active for new cases.\"",
              "**Then** Basic information › Forms counts agenda columns in \"<done> of <total> affected items reviewed\"; Cancel change drops the agenda review.",
              "**Then** cases already in progress keep their form version.",
            ],
          },
        ],
      },
      {
        title: "Epic 5 – Empty and edge states",
        stories: [
          {
            title: "5.1 No columns configured yet",
            story: "As a care unit admin of a new care unit, I want a clear starting point.",
            ac: [
              "**Then** the card has no status tag and no Edit button; a dashed box reads \"No additional columns yet\".",
              "**When** I click Add column there, **then** edit mode opens with the picker open.",
              "**Then** the preview shows system columns only.",
            ],
          },
          {
            title: "5.2 No request form selected",
            story: "As a care unit admin, I want to know why I can't add columns.",
            ac: [
              "**Then** an info notice reads \"Select a request form first. Agenda columns use its fields.\" with a link to Basic information › Forms.",
              "**Then** Add column is not available.",
            ],
          },
        ],
      },
    ],
    openQuestions: [
      "Who may edit agenda columns: only the care unit admin, or also the MDT chair?",
      "Do changes apply to meetings already scheduled, or only to new agendas?",
      "Is 9 the right maximum, and does it depend on screen width or print layout?",
      "Do agenda columns appear in the printed agenda and downloads?",
      "Is a change logged in an audit trail (who, when, what)?",
      "When a removed-field column is hidden, do clinicians see any hint?",
      "Should report form fields also be eligible as columns?",
    ],
  },
};
