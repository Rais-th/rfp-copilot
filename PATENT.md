# Provisional Patent Disclosure
## Title
Method and System for Generating Compliance Validated Response Skeletons to Government Requests for Proposal Using Large Language Model Semantic Alignment of Small Business Profile Attributes to Structured Solicitation Requirements

## Inventor
Rais Thelemuka, sole inventor, Memphis, Tennessee, United States

## Assignee
Popuzar LLC, Tennessee limited liability company

## Filed under
United States Patent and Trademark Office, Provisional Application

## Background
Government procurement in the United States publishes tens of thousands of requests for proposal and requests for qualification every year. Each solicitation imposes a unique set of required response sections, required qualifications, page and word limits, evaluation criteria, and required attachments. Writing a compliant response is a specialized skill and typically costs twenty to forty hours of proposal writing time per solicitation. Small businesses, including minority and women owned enterprises, cannot staff this work. The predictable result is concentration of public contracts in a small pool of incumbents, and persistent under attainment of diversity targets mandated by municipal and federal policy.

Existing tools in the market fall into three categories: (1) solicitation discovery platforms that surface RFPs but do not draft responses, (2) proposal management software for established firms with existing writing teams, and (3) general purpose large language model chat interfaces that hallucinate qualifications and produce non compliant prose. None of the three address the core problem faced by a solo operator small business: turning a one hundred page RFP into a compliant first draft in hours rather than days, without inventing credentials.

## Novel Method
The method comprises the following ordered operations:

### Step 1. Structured ingestion of a government solicitation
An ingestion pipeline retrieves a solicitation document from a public procurement portal, parses the underlying PDF or HTML, and produces a plain text representation of the full solicitation. A large language model with a strict extraction prompt then maps the plain text to a defined schema comprising: a plain English summary, an ordered list of required response sections each with optional page and word limits, a list of minimum qualifications, a list of evaluation criteria, a list of required attachments, and submission instructions. The extraction prompt forbids invention. Any required section whose presence is ambiguous in the source is labeled likely required, verify.

### Step 2. Client side small business profile capture
A structured profile schema is captured directly in the end user browser and persisted in browser local storage only. The schema includes business name, years in business, team size, North American Industry Classification System codes, Small Business Administration and state certification flags such as minority business enterprise, women business enterprise, disadvantaged business enterprise, eight a, historically underutilized business zone, veteran owned small business, and service disabled veteran owned small business, key personnel with roles and credentials, past work entries with client, value, year, and summary, and free text fields for core capabilities and differentiators. The profile is not transmitted to any server owned by the system operator except in the specific moment a draft generation is requested, and is never persisted server side.

### Step 3. Semantic alignment and skeleton generation
When a draft is requested, the structured solicitation requirements from Step 1 and the structured business profile from Step 2 are passed to a second large language model with a drafting system prompt. The drafting prompt enforces the following non negotiable rules: preserve required section order, use section names exactly as extracted, insert explicit fill in markers for any claim not supported by the profile, and forbid fabrication of past contracts, certifications, revenue, or personnel. The output is a markdown draft whose headings correspond one to one with the required sections from Step 1, whose prose cites only profile supported facts, and whose fill in markers flag every location where the human proposer must add solicitation specific content.

### Step 4. Compliance validation with gap flagging
A third large language model invocation compares the edited draft against the extracted requirements and returns a structured validation report. The report identifies missing sections, unsupported claims, and page or word limit overages. Each check is assigned a status of pass, warn, or fail, and the overall report carries an aggregate status. The validation prompt forbids invention of requirements not present in the extracted source.

### Step 5. Compliant export
The validated draft is rendered to a format acceptable to the target procurement platform, including Microsoft Word compatible docx and markdown, with headings preserved as first class document structure.

## Distinguishing Novelty
The method described above differs from prior art in three simultaneous respects, the combination of which constitutes the claimed novelty:

1. The business profile is held client side only, and semantic alignment is performed in a single transient request, which removes the requirement that the system operator hold sensitive business data in persistent storage.
2. The drafting model is constrained by an extracted requirements schema produced by a separate parsing model, rather than being asked to simultaneously interpret the RFP and draft the response. This separation is what makes the resulting drafts auditable against the source solicitation.
3. A third model validates the edited draft against the extracted requirements. The three model pipeline, extract, draft, validate, produces a written audit trail linking every section of the response to a corresponding requirement in the source solicitation.

## Example Embodiment
A reference implementation, also released under the MIT license, is available in the public repository github.com/Rais-th/rfp-copilot. The reference implementation uses Anthropic Claude Sonnet 4.6 for the extract and draft steps, Anthropic Claude Opus 4.7 for the validate step, Vercel Postgres for solicitation caching, browser local storage for the business profile, Next.js serverless functions for all server side operations, and Vercel Cron for nightly solicitation ingestion from the Memphis, Tennessee public procurement portal. The Memphis deployment is the first field deployment. The architecture is portable to any city, state, or federal procurement portal that publishes solicitations in HTML or PDF form.

## Plain Language Claims (for reference)
1. A method for generating a compliant draft response to a government request for proposal, comprising: retrieving a solicitation document, extracting a structured requirements schema using a large language model, receiving a business profile stored client side in a user browser, generating a response skeleton that preserves required section order and cites only profile supported facts, and validating the edited response against the extracted requirements.
2. The method of claim 1, wherein the business profile is not persisted on any server owned by the operator of the method.
3. The method of claim 1, wherein the extraction, drafting, and validation operations are each performed by separately prompted invocations of large language models with non overlapping system prompts.
4. The method of claim 1, wherein the drafting invocation is constrained to insert explicit fill in markers in place of any claim not supported by the business profile.
5. The method of claim 1, further comprising a cron triggered ingestion of newly published solicitations from a public procurement portal and persistence of the extracted structured requirements in a relational database.

## Drawings (to be attached)
- Figure 1: Three model pipeline diagram, extract, draft, validate.
- Figure 2: Data flow showing client side profile storage and transient transmission.
- Figure 3: Example mapping between extracted required sections and generated draft headings.

## Filing Notes
- USPTO Provisional Application. No formal claims required for filing.
- Micro entity fee, filed via USPTO Patent Center.
- Non provisional must be filed within twelve months.
