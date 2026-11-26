/*
 * Developer documentation shown in the page help drawer, keyed by page.
 * Source of truth: the "Agenda columns – developer backlog" doc
 * (https://claude.ai/artifact/1eFEFkuYPFyh3f9UQF4XX5). Keep both in sync.
 * `**text**` renders bold.
 */

export const PAGE_DOCS = {
  "basic-information": {
    title: "Reschedule reasons",
    path: "Care unit manager › Basic information › MDT info",
    overview: [
      "The reschedule reason options a clinician picks from when rescheduling a meeting now belong to the care unit instead of the request form. Source: requirement 4 – Centralize reschedule reasons (VS-16821).",
      "**Why:** today the value set is a characteristic on the request form (SDC_Form). Every new form version has to carry it over by hand; if it's missed, the reschedule dropdown is empty and the clinician can't reschedule. There is no fallback and no warning.",
      "**What changes:** both standard value sets move to the central form library (vtly_value_set). The care unit (wf_careunit) only references which one applies. Form version changes no longer affect rescheduling.",
    ],
    scope: {
      in: "Read-only display in MDT info, automatic assignment at care unit creation, migration of existing care units.",
      out: "Self-service editing, custom per-care-unit lists, the reschedule dialog itself.",
    },
    rules: [
      ["Value sets", "rescheduling-reason-oncology (7 options) and rescheduling-reason-general (4 options). Both stay in the library even if one is unused."],
      ["Assignment", "Set automatically when a care unit is created: therapeutic area Oncology → oncology set, anything else → general set. No admin action."],
      ["Display", "Read-only in MDT info with the info message \"In case you would like to change it to another value set, contact support.\""],
      ["Editing", "Not editable in the UI, also not in MDT info edit mode. Changes are rare and go through support."],
      ["Therapeutic area edit", "Editing the therapeutic area later doesn't switch the value set; the edit mode says so."],
      ["\"Other\"", "Selecting Other in the reschedule dialog still shows the free-text field."],
      ["Form versions", "Reschedule reasons are not an affected item in the form version review."],
      ["Migration", "Existing care units get the set matching their care unit type code. The reschedule-reasons characteristic on SDC_Form becomes dead data and is removed."],
    ],
    epics: [
      {
        title: "Epic 1 – Reschedule reasons on the care unit (VS-16821)",
        stories: [
          {
            title: "1.1 See which reschedule reasons apply",
            story: "As a care unit admin, I want to see which reschedule reasons clinicians get.",
            ac: [
              "**Given** I open Basic information, **then** MDT info shows \"Reschedule reasons\" with the set name and number of options.",
              "**When** I click Show options, **then** the options are listed in dropdown order; Other is marked as free text.",
              "**Then** an info message says to contact support to change the value set.",
            ],
          },
          {
            title: "1.2 Read-only in edit mode",
            story: "As a care unit admin, I want it clear that I can't change the reschedule reasons myself.",
            ac: [
              "**When** I edit MDT info, **then** reschedule reasons show a Read-only tag and no input.",
              "**Given** I change the therapeutic area, **then** the message says this doesn't change the reschedule reasons.",
            ],
          },
          {
            title: "1.3 Independent of form versions",
            story: "As a care unit admin, I want a request form change to leave rescheduling working.",
            ac: [
              "**Given** I activate a new request form version, **then** the reschedule dropdown keeps the same options.",
              "**Then** reschedule reasons are not listed in the version impact dialog.",
            ],
          },
        ],
      },
    ],
    openQuestions: [
      "Should a care unit type code that is neither oncology nor general fall back to general?",
      "Should admins see the list of options, or only the set name?",
      "Do the option labels need translations in this UI?",
    ],
  },
  "forms/pre-population": {
    title: "Report form pre-population",
    path: "Care unit manager › Forms › Report form pre-population",
    overview: [
      "Care unit admins choose which request form fields pre-fill the report form. Source: requirement 2 – Request > Report field mapping configuration (VS-16812, VS-16814).",
      "**When it fires:** once per referral, the first time the scribe opens the Decision draft after the referral enters In review, while the report has not been saved. Values keep updating until the MDT decision is saved.",
      "**Why:** today the mapping is keyed by the request + report form pair and must be recreated by hand for every new form version. Moving it to the care unit keeps it across versions.",
    ],
    scope: {
      in: "Viewing, adding, editing and removing mappings; type validation; flagging mappings whose field was removed after a form version change.",
      out: "Mapping on answer-option level, defaults for new care units, the scribe's Decision draft screen itself.",
    },
    rules: [
      ["From fields", "Only fields of the care unit's active request form questionnaire."],
      ["To fields", "Only fields of the care unit's active report form questionnaire. A report field can be the target of one mapping only."],
      ["Allowed types", "Text (string), Text area (text), Check-box (boolean), Date, Date time, Choice. Mapping only between the same type and subtype."],
      ["Choice subtypes", "Only select and radio map. Checkboxes, slider and matrix choices, open choice, group and display fields are not supported."],
      ["Type mismatch", "Shown on the row at configuration time; saving is prevented until fixed."],
      ["No configuration", "Optional. Without mappings the report form opens blank."],
      ["Removed field", "After a form version change, mappings whose from or to field no longer exists are flagged and skipped when pre-filling."],
      ["Version review", "Pre-population is an affected item in the request and report form version review. The new version goes live only after all affected items are reviewed."],
    ],
    epics: [
      {
        title: "Epic 1 – View and configure mappings (VS-16812)",
        stories: [
          {
            title: "1.1 Navigate to pre-population",
            story: "As a care unit admin, I want to find report pre-population under Forms, so that all form settings sit together.",
            ac: [
              "**Given** I open Forms, **then** I see the sub-tabs Output documents and Report form pre-population.",
              "**Given** pre-population needs review, **then** its sub-tab and the Forms tab show an amber dot.",
            ],
          },
          {
            title: "1.2 See the configured mappings",
            story: "As a care unit admin, I want to see which request fields pre-fill which report fields.",
            ac: [
              "**Then** the card shows \"From <request form> → to <report form>\" and an explanation of when pre-filling happens.",
              "**Then** each mapping is a row: request field with type tag → report field with type tag, under the headers \"From — request form\" and \"To — report form\".",
              "**Then** the status reads \"Up to date\" and an Edit button is shown.",
            ],
          },
          {
            title: "1.3 No mappings configured",
            story: "As an admin of a new care unit, I want a clear starting point.",
            ac: [
              "**Then** the card reads \"No mappings configured\" and \"The report form opens blank when first filled in.\"",
              "**When** I click Add mapping, **then** edit mode opens with one empty mapping row.",
            ],
          },
          {
            title: "1.4 Add, change and remove mappings",
            story: "As a care unit admin, I want to maintain the mappings myself.",
            ac: [
              "**When** I click Edit, **then** each mapping becomes two field pickers (request → report) with a remove button.",
              "**Then** each picker lists the active form's fields with their type; unsupported types are listed but disabled.",
              "**Then** a report field already used by another mapping is disabled with \"already mapped\".",
              "**When** I click Add mapping, **then** an empty row is added at the end.",
              "**When** I click ×, **then** the row is removed.",
            ],
          },
          {
            title: "1.5 Type validation",
            story: "As a care unit admin, I want to be stopped from mapping incompatible fields.",
            ac: [
              "**Given** the two fields differ in type or choice subtype, **then** the row turns red with \"Type mismatch: <from type> → <to type>. Map fields of the same type.\"",
              "**Then** Save mappings is disabled and the footer says how many mismatches to fix.",
              "**Given** a row is incomplete, **then** saving is disabled with \"Complete or remove <n> unfinished mapping(s).\"",
              "**When** I click Cancel, **then** all draft changes are discarded.",
            ],
          },
        ],
      },
      {
        title: "Epic 2 – Review mappings after a form change (VS-16814)",
        stories: [
          {
            title: "2.1 Pre-population in the version review",
            story: "As a care unit admin, I want pre-population checked when a request or report form version changes.",
            ac: [
              "**Given** I change the request or report form version and it removes a mapped field, **then** the impact dialog lists \"Report form pre-population\" with the affected fields.",
              "**When** I start the review, **then** the card shows \"Needs review\" and the banner \"One or more forms are changing. Please review.\" with the version changes.",
              "**Then** the removed side of each affected mapping is red and struck through; its icon explains that the mapping is skipped when pre-filling.",
            ],
          },
          {
            title: "2.2 Confirm the review",
            story: "As a care unit admin, I want to confirm so the new form version can go live.",
            ac: [
              "**When** I click \"Remove <n> mapping(s) and confirm\", **then** the affected mappings are deleted and the card shows the new form versions.",
              "**Given** it was the last affected item, **then** the new form version becomes active.",
              "**Then** all other mappings are carried forward to the new version unchanged.",
            ],
          },
        ],
      },
    ],
    openQuestions: [
      "Should mapping on answer-option level (e.g. choice values) be included?",
      "Should new care units get default mappings (e.g. proposed conclusion → conclusion)?",
      "Can one request field pre-fill several report fields?",
    ],
  },
  "other-settings/agenda-columns": {
    title: "Agenda columns",
    path: "Care unit manager › Other settings › Agenda columns",
    fullDoc: "https://claude.ai/artifact/1eFEFkuYPFyh3f9UQF4XX5",
    overview: [
      "Care unit admins choose up to 9 request-form fields to show as extra columns on the MDT meeting agenda, after the fixed system columns.",
      "**Who:** the care unit admin configures; clinicians and MDT members see the result on the meeting agenda.",
      "**Why:** each care unit sees the case details that matter to its meeting (e.g. organ type, urgency) without opening every case.",
    ],
    scope: {
      in: "Viewing, adding, removing and reordering agenda columns; the agenda preview; fields removed from the request form; the request form version review.",
      out: "Past MDTs fields (own page), the meeting agenda page itself, column widths, sorting and filtering on the agenda.",
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
      ["Preview data", "The preview never shows realistic clinical data. Field values are lorem ipsum, the same placeholder in every row: three words, or one fixed paragraph for Text area fields. Patient shows as LAST NAME, first name · ID xxxxxxx · dd/mm/yyyy."],
    ],
    epics: [
      {
        title: "Epic 1 – View configured agenda columns",
        stories: [
          {
            title: "1.1 Navigate to agenda columns",
            story: "As a care unit admin, I want to find the agenda column settings under Other settings, next to the other form-driven display settings.",
            ac: [
              "**Given** I open a care unit, **then** the top tabs are Basic information, Forms, Meeting, Other settings and Members.",
              "**Given** I open Other settings, **then** the sub-tabs are Agenda columns and Past MDTs fields, with Agenda columns selected.",
              "**Given** agenda columns need review, **then** the Agenda columns sub-tab and the Other settings tab show an amber dot.",
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

  "other-settings/past-mdts-fields": {
    title: "Past MDTs fields",
    path: "Care unit manager › Other settings › Past MDTs fields",
    overview: [
      "Care unit admins choose which report form fields a clinician sees for each previous MDT report when a patient is re-discussed (Referral › Historical MDTs). Source: requirement 3 – Past MDTs fields configuration (VS-16817, VS-16818).",
      "**When it shows:** only for referrals with the REDISCUSSED tag, i.e. the patient was referred to this or another MDT before. Each previous report is an accordion item with title and date; opening it shows the configured fields, stacked in the configured order.",
      "**Why:** today the configuration is keyed by the versioned report questionnaire, so every new report form version needs a new entry by hand. Moving it to the care unit keeps it across versions.",
    ],
    scope: {
      in: "Viewing, adding, removing and reordering fields; the Historical MDTs preview; fields removed by a report form version change; the report form version review.",
      out: "The Consultation material and My notes tabs, the referral screen itself, per-answer-option configuration.",
    },
    rules: [
      ["Source of fields", "Only fields of the care unit's active report form questionnaire (not the request form)."],
      ["Number of fields", "No limit. Fields are stacked one below another."],
      ["Data types", "All data types can be shown; monitor behaviour and user feedback."],
      ["Order", "The configured order is the order in the accordion. Reorder with drag and drop."],
      ["Default", "New care units start with Conclusion and Policy. The admin can remove them if the report form doesn't have them."],
      ["No configuration", "Optional. Without fields, a previous report still appears with title and date, but shows no fields."],
      ["Older reports", "Reports answered on an older report form version keep the fields configured for that version. Edits apply to the current version only."],
      ["Removed field", "After a report form version change, fields no longer in the new version are flagged and stay until the admin removes them. Only valid fields are shown."],
      ["Version review", "Past MDTs fields are an affected item in the report form version review. The new version goes live only after all affected items are reviewed."],
      ["Preview data", "The preview never shows realistic clinical data. Field values are lorem ipsum, the same placeholder in every row: three words, or one fixed paragraph for Text area fields. Patient shows as LAST NAME, first name · ID xxxxxxx · dd/mm/yyyy."],
    ],
    epics: [
      {
        title: "Epic 1 – Configure Past MDTs fields (VS-16817)",
        stories: [
          {
            title: "1.1 Navigate to Past MDTs fields",
            story: "As a care unit admin, I want to find the Past MDTs fields under Other settings.",
            ac: [
              "**Given** I open Other settings, **then** the sub-tabs are Agenda columns and Past MDTs fields.",
              "**Then** the page has its own link: #/other-settings/past-mdts-fields.",
            ],
          },
          {
            title: "1.2 See the configured fields",
            story: "As a care unit admin, I want to see which fields clinicians get from previous reports.",
            ac: [
              "**Then** the card shows \"Past MDTs fields\", a status tag (Up to date, Needs review, Not set up), the source form version and a numbered list with type tags.",
              "**Then** the count reads \"<n> fields in use\".",
            ],
          },
          {
            title: "1.3 Edit fields",
            story: "As a care unit admin, I want to add, remove and reorder fields.",
            ac: [
              "**When** I click Edit, **then** the card enters edit mode with drag handles, × per row and an \"Add field\" button.",
              "**When** I click Add field, **then** a searchable list of report form fields opens; fields already selected are not offered.",
              "**Then** new fields get a \"New\" tag until saved; Cancel discards all changes; Save fields applies them.",
            ],
          },
          {
            title: "1.4 Preview",
            story: "As a care unit admin, I want to see what clinicians will see.",
            ac: [
              "**Then** the preview shows Historical MDTs with 3 sample previous reports; one is open by default and each opens and closes on click.",
              "**Then** the open report lists the configured fields (label above value) in order; it follows edits live, newly added fields are highlighted.",
              "**Then** a report answered on an earlier form version keeps its own fields and says so.",
            ],
          },
          {
            title: "1.5 No fields configured",
            story: "As a care unit admin of a new care unit, I want a clear starting point.",
            ac: [
              "**Then** the card shows \"Not set up\" and \"No fields configured\" with a \"Configure fields\" button that opens edit mode with the field list open.",
              "**Then** reports in the preview show only their title and date.",
            ],
          },
        ],
      },
      {
        title: "Epic 2 – Review after a report form change (VS-16818)",
        stories: [
          {
            title: "2.1 Past MDTs fields in the version review",
            story: "As a care unit admin, I want removed fields flagged when the report form version changes.",
            ac: [
              "**Given** I change the report form version, **then** the impact dialog lists \"Past MDTs fields\" with the removed fields, or \"Not affected\".",
              "**Then** the card shows \"Needs review\", an amber notice and removed rows in red with a tooltip; Other settings and the sub-tab show an amber dot.",
              "**Then** removed fields disappear from the preview.",
            ],
          },
          {
            title: "2.2 Confirm the review",
            story: "As a care unit admin, I want to confirm so the new version can go live.",
            ac: [
              "**When** I click \"Remove <n> field(s) and confirm\", **then** they are deleted and the card shows the new version.",
              "**Given** it was the last affected item, **then** the new report form version becomes active; otherwise a toast says other items remain.",
              "**Then** reports already written on the old version keep their fields.",
            ],
          },
        ],
      },
    ],
    openQuestions: [
      "Should very long values (Text area) be truncated in the accordion?",
      "Is the Conclusion + Policy default added at care unit creation, or when the report form is first selected?",
      "Should Past MDTs fields support answer-option level filtering?",
      "Are changes logged in an audit trail?",
    ],
  },
};
