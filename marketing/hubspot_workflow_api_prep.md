# Workflow build via HubSpot API - prep notes (29 Sep 2026)

Purpose: build W2, W3, W4, W5, W7, W8, W0 through the Automation v4 API in a fresh session
once `HUBSPOT_PRIVATE_APP_TOKEN` (private app "Claude workflow builder", scopes automation,
crm.objects.contacts.read, crm.lists.read, crm.schemas.contacts.read) is in the environment.
W6 and W1 were built by hand in the editor on 29 Sep; W1 starts at A2 (no A1).

## Steps for the new session
1. `curl -H "Authorization: Bearer $HUBSPOT_PRIVATE_APP_TOKEN" https://api.hubapi.com/automation/v4/flows`
   list flows; GET W6 and W1 by id to copy the exact JSON for: manual enrollment, suppressionListIds
   [58, 59, 68], goal criteria (engagements_last_meeting_booked is known), delay 0-1 (delta/time_unit),
   the delay-until-day-of-week/time action, send email 0-4 (content_id).
2. GET "IBO Drip Campaign - Trigger & Task" (existing, has a task action) for the create-task shape.
3. Build the seven flows per marketing/WORKFLOW_BUILD_GUIDE.md, isEnabled false, no "Go to workflow"
   actions (added on go-live day once targets are on). POST /automation/v4/flows.
4. Verify each in the editor URL: https://app-na2.hubspot.com/workflows/245308986/platform/flow/<id>/edit

## Send-email content_id values (hs_origin_asset_id, NOT the CRM object id)
| Key | content_id | CRM object id |
|---|---|---|
| A1 | 402319846131 | 860702939871 |
| A1b | 402323441400 | 860669025996 |
| A2 | 402323442421 | 860757860060 |
| A3 | 402323461862 | 860757965554 |
| A4 | 402353606377 | 860704843490 |
| A5 | 402353623785 | 860699558620 |
| A6 | 402323479237 | 860637635289 |
| A7 | 402323479241 | 860645689025 |
| A8 | 402353623789 | 860708443897 |
| B1 | 402353623800 | 860761459403 |
| B2 | 402323479269 | 860703195883 |
| B3 | 402353624787 | 860750653125 |
| B4 | 402323480252 | 860694432493 |
| B5 (automated) | 402565924546 | 861120111300 |
| C1 | 402323442396 | 860645492456 |
| D1 | 402304858823 | 860706602689 |
| D2 | 402353605362 | 860659891926 |
| D3 | 402353606354 | 860635590372 |
| D4 | 402323480291 | 860701586150 |
| F1 (automated) | 402565924550 | 861123106525 |
| F3 | 402353625838 | 860759619306 |
| F4 (automated) | 402564904679 | 861122596600 |
| L1 | 402304857794 | 860750506702 |
| L2 | 402353605334 | 860710187760 |
| L3 | 402323461865 | 860669137645 |
| Q | 402323462845 | 860640395972 |

Retired batch B5 402353624804 (sent) - do not use.

## Other ids
- Learn More form GUID: ec6307ff-aa5a-4e75-b423-11846eab6ad7 (form-submission eventTypeId 4-1639801,
  filter property hs_form_id IS_ANY_OF).
- Lists: 58 never nurture, 59 met Michael (static), 68 replied or contact in a year, 57 catch-up cohort.
- Owner for the W0 task: Edmund Breitling (look up owner id via GET /crm/v3/owners).
- Properties: ibo_qualified (True/False), what_is_your_approximate_annual_ebitda,
  what_is_your_approximate_annual_ebitda_profit, role ('Business Advisor'), hs_analytics_source
  ('PAID_SOCIAL'), engagements_last_meeting_booked, hs_lead_status.

## Known API shapes (from HubSpot docs, 29 Sep)
- Delay: `{"type":"SINGLE_CONNECTION","actionId":"3","actionTypeVersion":0,"actionTypeId":"0-1",
  "connection":{"edgeType":"STANDARD","nextActionId":"2"},"fields":{"delta":"1440","time_unit":"MINUTES"}}`
- Send email: actionTypeId "0-4", fields {"content_id":"<id>"}
- Create task: "0-3"; edit record (set property): "0-5"; delay until date/day: "0-35".
- Form-submission enrollment: enrollmentCriteria.type EVENT_BASED, eventFilterBranches[0] with
  eventTypeId "4-1639801", operator HAS_COMPLETED, filterBranchType UNIFIED_EVENTS, filters
  [{property:"hs_form_id", filterType:"PROPERTY", operation:{operator:"IS_ANY_OF",
  operationType:"ENUMERATION", values:["<form guid>"], includeObjectsWithNoValueSet:false}}].
- Property enrollment: type LIST_BASED with listFilterBranch / filterBranches of PROPERTY filters.
- Branch actions have no fields/connection; they use listBranches (each with filterBranch and
  connection) plus defaultBranch. Copy the exact shape from a GET of an existing branching flow.

## Verbatim shapes from HubSpot's action reference (fetched 29 Sep)
LIST_BRANCH (if/then; "GOTO" edgeType is how a branch rejoins an earlier/other action):
```json
{"type":"LIST_BRANCH","actionId":"6",
 "listBranches":[{"filterBranch":{...same shape as listFilterBranch below...},"branchName":"Qualified",
   "connection":{"edgeType":"STANDARD","nextActionId":"7"}}],
 "defaultBranchName":"Fall-through branch","defaultBranch":{"edgeType":"STANDARD","nextActionId":"8"}}
```
STATIC_BRANCH (value-equals on one property):
```json
{"type":"STATIC_BRANCH","actionId":"1","inputValue":{"propertyName":"example_property"},
 "staticBranches":[{"branchValue":"v1","connection":{"edgeType":"STANDARD","nextActionId":"2"}}],
 "defaultBranchName":"Fall-through branch","defaultBranch":{"edgeType":"STANDARD","nextActionId":"4"}}
```
Delay until date (0-35): fields {"date":{"type":"STATIC_VALUE" or property ref},"delta":"0","time_unit":"DAYS","time_of_day":{"hour":7,"minute":30}}.
Delay until day-of-week/time: copy from GET of W6 (built in UI).
Edit record (0-5): fields {"property_name":"ibo_qualified","association":{"associationCategory":"HUBSPOT_DEFINED","associationTypeId":1},"value":{"staticValue":"True"}}.
Create task (0-3): fields {"task_type":"CALL","subject":"...","body":"<p>..</p>","priority":"HIGH",
  "associations":[{"target":{"associationCategory":"HUBSPOT_DEFINED","associationTypeId":10},"value":{"type":"ENROLLED_OBJECT"}}],
  "use_explicit_associations":"true", plus owner/due-date fields - copy from GET of "IBO Drip Campaign - Trigger & Task"}.
LIST_BASED enrollment: {"shouldReEnroll":false,"type":"LIST_BASED","listFilterBranch":{"filterBranches":[{"filterBranches":[],
  "filters":[{"property":"hs_analytics_source","operation":{"operator":"IS_ANY_OF","includeObjectsWithNoValueSet":false,
  "values":["PAID_SOCIAL"],"operationType":"ENUMERATION"},"filterType":"PROPERTY"}],"filterBranchType":"AND","filterBranchOperator":"AND"}],
  "filters":[],"filterBranchType":"OR","filterBranchOperator":"OR"},"unEnrollObjectsNotMeetingCriteria":false,"reEnrollmentTriggersFilterBranches":[]}
Enroll in another workflow: exists as an action ("enroll record in another workflow of the same type"); actionTypeId to be read from a GET once one is added in the UI, or omitted (go-live day add).
