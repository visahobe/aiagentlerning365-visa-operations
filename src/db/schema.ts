import {
  boolean,
  date,
  integer,
  jsonb,
  numeric,
  pgEnum,
  pgTable,
  serial,
  text,
  timestamp,
  uuid,
  varchar,
} from "drizzle-orm/pg-core";

/* ------------------------------- ENUMS -------------------------------- */

export const visaCategoryEnum = pgEnum("visa_category", ["Work", "Visitor", "Self_Sponsorship"]);
export const verificationStatusEnum = pgEnum("verification_status", ["Verified", "Pending", "Blacklisted"]);
export const demandStatusEnum = pgEnum("demand_status", ["Open", "Closed", "Paused"]);
export const applicationStageEnum = pgEnum("application_stage", [
  "New_Lead",
  "Docs_Verified",
  "Employer_Matched",
  "Work_Permit_Submitted",
  "Consular_Review",
  "Visa_Approved",
  "Flight_Deployed",
  "Rejected",
]);
export const paymentMethodEnum = pgEnum("payment_method", ["bKash", "Nagad", "Bank"]);
export const paymentStageEnum = pgEnum("payment_stage", ["Advance", "Stage_2", "Final"]);
export const automationStatusEnum = pgEnum("automation_status", ["queued", "running", "success", "warning", "failed"]);
export const withdrawalStatusEnum = pgEnum("withdrawal_status", ["Pending", "Approved", "Rejected"]);

/* ----------------------------- MASTER DATA ----------------------------- */

export const countries = pgTable("countries", {
  id: serial("id").primaryKey(),
  iso3: varchar("iso3", { length: 3 }).notNull().unique(),
  nameBn: varchar("name_bn", { length: 120 }).notNull(),
  nameEn: varchar("name_en", { length: 120 }).notNull(),
  flag: varchar("flag", { length: 16 }).notNull(),
  adminPortal: varchar("admin_portal", { length: 180 }).notNull(),
  portalUrl: varchar("portal_url", { length: 220 }).notNull(),
  legalBasis: text("legal_basis").notNull(),
  workMethod: text("work_method").notNull(),
  visitorCategory: text("visitor_category").notNull(),
  selfSponsorPathway: text("self_sponsor_pathway").notNull(),
  processingWindow: varchar("processing_window", { length: 60 }).notNull(),
  avgMinDays: integer("avg_min_days").notNull(),
  avgMaxDays: integer("avg_max_days").notNull(),
  automationSteps: jsonb("automation_steps").$type<string[]>().notNull().default([]),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
});

export const visaTypes = pgTable("visa_types", {
  id: serial("id").primaryKey(),
  code: varchar("code", { length: 8 }).notNull().unique(),
  categoryName: visaCategoryEnum("category_name").notNull(),
  labelBn: varchar("label_bn", { length: 120 }).notNull(),
  baseProcessingFee: numeric("base_processing_fee", { precision: 12, scale: 2 }).notNull(),
  affiliateCommission: numeric("affiliate_commission", { precision: 12, scale: 2 }).notNull(),
  slaDays: integer("sla_days").notNull().default(7),
  description: text("description").notNull(),
});

/* --------------------------- EMPLOYER ECOSYSTEM ------------------------ */

export const employers = pgTable("employers", {
  id: uuid("id").primaryKey().defaultRandom(),
  companyName: varchar("company_name", { length: 200 }).notNull(),
  countryIso: varchar("country_iso", { length: 3 }).notNull(),
  tradeLicenseNo: varchar("trade_license_no", { length: 80 }).notNull(),
  taxId: varchar("tax_id", { length: 80 }).notNull(),
  contactPerson: varchar("contact_person", { length: 140 }).notNull(),
  contactTitle: varchar("contact_title", { length: 120 }).notNull().default("HR Manager"),
  email: varchar("email", { length: 180 }).notNull(),
  phone: varchar("phone", { length: 60 }).notNull(),
  website: varchar("website", { length: 180 }).notNull(),
  verificationStatus: verificationStatusEnum("verification_status").notNull().default("Pending"),
  screeningNote: text("screening_note").notNull().default(""),
  agreementPdfUrl: varchar("agreement_pdf_url", { length: 220 }),
  agreementSignedAt: timestamp("agreement_signed_at", { withTimezone: true }),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
});

export const demands = pgTable("demands", {
  id: uuid("id").primaryKey().defaultRandom(),
  employerId: uuid("employer_id")
    .notNull()
    .references(() => employers.id, { onDelete: "cascade" }),
  jobTitle: varchar("job_title", { length: 140 }).notNull(),
  jobCategory: varchar("job_category", { length: 100 }).notNull(),
  requiredWorkers: integer("required_workers").notNull().default(1),
  fulfilledCount: integer("fulfilled_count").notNull().default(0),
  salary: numeric("salary", { precision: 12, scale: 2 }).notNull(),
  currency: varchar("currency", { length: 8 }).notNull().default("EUR"),
  workingHours: varchar("working_hours", { length: 60 }).notNull().default("8 ঘণ্টা / দৈনিক"),
  overtimePolicy: varchar("overtime_policy", { length: 140 }).notNull().default("১২৫% ওভারটাইম হার"),
  accommodation: varchar("accommodation", { length: 140 }).notNull().default("কোম্পানি প্রদত্ত"),
  medicalInsurance: varchar("medical_insurance", { length: 140 }).notNull().default("সম্পূর্ণ কভারেজ"),
  foodAllowance: varchar("food_allowance", { length: 140 }).notNull().default("খাদ্য ভাতা প্রযোজ্য"),
  status: demandStatusEnum("status").notNull().default("Open"),
  blacklistFlag: boolean("blacklist_flag").notNull().default(false),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
});

export const partners = pgTable("partners", {
  id: uuid("id").primaryKey().defaultRandom(),
  employerId: uuid("employer_id")
    .notNull()
    .references(() => employers.id, { onDelete: "cascade" }),
  partnerName: varchar("partner_name", { length: 160 }).notNull(),
  countryIso: varchar("country_iso", { length: 3 }).notNull(),
  commissionRate: numeric("commission_rate", { precision: 6, scale: 2 }).notNull().default("12.00"),
  agreementPdfUrl: varchar("agreement_pdf_url", { length: 220 }),
  profitShareBalance: numeric("profit_share_balance", { precision: 14, scale: 2 }).notNull().default("0"),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
});

/* ------------------------------- AFFILIATES ---------------------------- */

export const affiliates = pgTable("affiliates", {
  id: uuid("id").primaryKey().defaultRandom(),
  agentName: varchar("agent_name", { length: 140 }).notNull(),
  district: varchar("district", { length: 80 }).notNull(),
  upazila: varchar("upazila", { length: 80 }).notNull().default(""),
  phone: varchar("phone", { length: 40 }).notNull(),
  referralCode: varchar("referral_code", { length: 24 }).notNull().unique(),
  walletBalance: numeric("wallet_balance", { precision: 14, scale: 2 }).notNull().default("0"),
  totalEarned: numeric("total_earned", { precision: 14, scale: 2 }).notNull().default("0"),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
});

export const commissions = pgTable("commissions", {
  id: uuid("id").primaryKey().defaultRandom(),
  affiliateId: uuid("affiliate_id")
    .notNull()
    .references(() => affiliates.id, { onDelete: "cascade" }),
  clientId: uuid("client_id"),
  visaCode: varchar("visa_code", { length: 8 }).notNull(),
  amount: numeric("amount", { precision: 12, scale: 2 }).notNull(),
  note: varchar("note", { length: 200 }).notNull().default(""),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
});

export const withdrawals = pgTable("withdrawals", {
  id: uuid("id").primaryKey().defaultRandom(),
  affiliateId: uuid("affiliate_id")
    .notNull()
    .references(() => affiliates.id, { onDelete: "cascade" }),
  amount: numeric("amount", { precision: 12, scale: 2 }).notNull(),
  method: paymentMethodEnum("method").notNull(),
  accountRef: varchar("account_ref", { length: 120 }).notNull(),
  status: withdrawalStatusEnum("status").notNull().default("Pending"),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
});

/* -------------------------------- CLIENTS ------------------------------ */

export const clients = pgTable("clients", {
  id: uuid("id").primaryKey().defaultRandom(),
  clientCode: varchar("client_code", { length: 40 }).notNull().unique(),
  fullName: varchar("full_name", { length: 160 }).notNull(),
  passportNo: varchar("passport_no", { length: 40 }).notNull(),
  passportExpiry: date("passport_expiry").notNull(),
  passportValidityDays: integer("passport_validity_days").notNull().default(0),
  phone: varchar("phone", { length: 40 }).notNull(),
  email: varchar("email", { length: 180 }).notNull().default(""),
  age: integer("age").notNull().default(25),
  skill: varchar("skill", { length: 120 }).notNull().default("General Worker"),
  countryIso: varchar("country_iso", { length: 3 }).notNull(),
  visaCode: varchar("visa_code", { length: 8 }).notNull(),
  stage: applicationStageEnum("stage").notNull().default("New_Lead"),
  validationReport: jsonb("validation_report").$type<unknown[]>().notNull().default([]),
  docsVerified: boolean("docs_verified").notNull().default(false),
  contractValue: numeric("contract_value", { precision: 12, scale: 2 }).notNull().default("0"),
  affiliateId: uuid("affiliate_id").references(() => affiliates.id, { onDelete: "set null" }),
  demandId: uuid("demand_id").references(() => demands.id, { onDelete: "set null" }),
  employerId: uuid("employer_id").references(() => employers.id, { onDelete: "set null" }),
  stageUpdatedAt: timestamp("stage_updated_at", { withTimezone: true }).defaultNow().notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
});

export const applications = pgTable("applications", {
  id: uuid("id").primaryKey().defaultRandom(),
  clientId: uuid("client_id")
    .notNull()
    .references(() => clients.id, { onDelete: "cascade" }),
  stage: applicationStageEnum("stage").notNull().default("New_Lead"),
  governmentPortal: varchar("government_portal", { length: 160 }).notNull().default(""),
  permitSubmissionDate: timestamp("permit_submission_date", { withTimezone: true }),
  embassyDate: timestamp("embassy_date", { withTimezone: true }),
  govTrackingCode: varchar("gov_tracking_code", { length: 80 }).notNull().default(""),
  appointmentSlot: varchar("appointment_slot", { length: 80 }),
  scraperStatus: varchar("scraper_status", { length: 120 }).notNull().default("Pending"),
  lastStatusSync: timestamp("last_status_sync", { withTimezone: true }),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
});

export const documentChecks = pgTable("document_checks", {
  id: uuid("id").primaryKey().defaultRandom(),
  clientId: uuid("client_id")
    .notNull()
    .references(() => clients.id, { onDelete: "cascade" }),
  docType: varchar("doc_type", { length: 60 }).notNull(),
  parameter: varchar("parameter", { length: 160 }).notNull(),
  measuredValue: varchar("measured_value", { length: 120 }).notNull(),
  standard: varchar("standard", { length: 160 }).notNull(),
  passed: boolean("passed").notNull(),
  verdict: varchar("verdict", { length: 240 }).notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
});

export const payments = pgTable("payments", {
  id: uuid("id").primaryKey().defaultRandom(),
  clientId: uuid("client_id")
    .notNull()
    .references(() => clients.id, { onDelete: "cascade" }),
  amount: numeric("amount", { precision: 12, scale: 2 }).notNull(),
  paymentMethod: paymentMethodEnum("payment_method").notNull().default("bKash"),
  paymentStage: paymentStageEnum("payment_stage").notNull().default("Advance"),
  transactionRef: varchar("transaction_ref", { length: 80 }).notNull().default(""),
  invoiceNo: varchar("invoice_no", { length: 60 }).notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
});

export const emailsLog = pgTable("emails_log", {
  id: uuid("id").primaryKey().defaultRandom(),
  clientId: uuid("client_id").references(() => clients.id, { onDelete: "set null" }),
  recipientEmail: varchar("recipient_email", { length: 200 }).notNull(),
  subject: varchar("subject", { length: 240 }).notNull(),
  triggerType: varchar("trigger_type", { length: 80 }).notNull(),
  sentStatus: boolean("sent_status").notNull().default(true),
  sentAt: timestamp("sent_at", { withTimezone: true }).defaultNow().notNull(),
});

export const deployments = pgTable("deployments", {
  id: uuid("id").primaryKey().defaultRandom(),
  clientId: uuid("client_id")
    .notNull()
    .references(() => clients.id, { onDelete: "cascade" }),
  flightDate: timestamp("flight_date", { withTimezone: true }).notNull(),
  airline: varchar("airline", { length: 120 }).notNull(),
  pnrNumber: varchar("pnr_number", { length: 40 }).notNull(),
  destinationAirport: varchar("destination_airport", { length: 120 }).notNull(),
  airportPickupStatus: boolean("airport_pickup_status").notNull().default(false),
});

export const automationJobs = pgTable("automation_jobs", {
  id: uuid("id").primaryKey().defaultRandom(),
  jobType: varchar("job_type", { length: 60 }).notNull(),
  countryIso: varchar("country_iso", { length: 3 }).notNull(),
  scheduledSlot: varchar("scheduled_slot", { length: 40 }).notNull(),
  status: automationStatusEnum("status").notNull().default("queued"),
  slotsFound: integer("slots_found").notNull().default(0),
  clientsProcessed: integer("clients_processed").notNull().default(0),
  resultMessage: text("result_message").notNull().default(""),
  startedAt: timestamp("started_at", { withTimezone: true }).defaultNow().notNull(),
  finishedAt: timestamp("finished_at", { withTimezone: true }),
});

export const slaAlerts = pgTable("sla_alerts", {
  id: uuid("id").primaryKey().defaultRandom(),
  clientId: uuid("client_id")
    .notNull()
    .references(() => clients.id, { onDelete: "cascade" }),
  stage: applicationStageEnum("stage").notNull(),
  stalledDays: integer("stalled_days").notNull(),
  severity: varchar("severity", { length: 20 }).notNull().default("critical"),
  resolved: boolean("resolved").notNull().default(false),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
});
