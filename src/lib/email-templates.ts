import { ORG } from "./reference-data";

export interface EmailPayload {
  heading: string;
  greeting: string;
  bodyHtml: string;
  highlightLabel?: string;
  highlightValue?: string;
}

/** ইনলাইন CSS + টেবিল আর্কিটেকচার ভিত্তিক রেসপনসিভ HTML ইমেইল ফ্রেমওয়ার্ক */
export function renderEmailFrame(payload: EmailPayload): string {
  const highlight = payload.highlightValue
    ? `
              <table width="100%" border="0" cellspacing="0" cellpadding="0" style="margin: 25px 0;">
                <tr>
                  <td align="center" style="background-color: #eef4f9; border-left: 5px solid #0b3c5d; padding: 16px; border-radius: 4px;">
                    <span style="font-size: 13px; color: #555555; text-transform: uppercase;">${payload.highlightLabel ?? ""}</span><br>
                    <span style="font-size: 20px; font-weight: 700; color: #0b3c5d; font-family: monospace;">${payload.highlightValue}</span>
                  </td>
                </tr>
              </table>`
    : "";

  return `<!DOCTYPE html>
<html lang="bn">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${ORG.name}</title>
</head>
<body style="margin: 0; padding: 0; font-family: 'Segoe UI', Arial, sans-serif; background-color: #f0f4f8;">
  <table width="100%" border="0" cellspacing="0" cellpadding="0" style="background-color: #f0f4f8; padding: 25px 0;">
    <tr>
      <td align="center">
        <table width="600" border="0" cellspacing="0" cellpadding="0" style="background-color: #ffffff; border-radius: 8px; overflow: hidden; box-shadow: 0 4px 10px rgba(0,0,0,0.06); max-width: 94%;">
          <tr>
            <td align="center" style="background-color: #0b3c5d; padding: 30px 20px;">
              <h1 style="color: #ffffff; margin: 0; font-size: 24px; font-weight: 700; letter-spacing: 0.5px;">${ORG.name}</h1>
              <p style="color: #99b8d1; margin: 6px 0 0 0; font-size: 13px; text-transform: uppercase;">AI ভিসা সুপার এজেন্ট ডিপ অটোমেশন প্ল্যাটফর্ম</p>
            </td>
          </tr>
          <tr>
            <td style="padding: 35px 30px; color: #333333; line-height: 1.6; font-size: 15px;">
              <p style="margin-top: 0; font-size: 16px; font-weight: 600; color: #0b3c5d;">${payload.heading}</p>
              <p>${payload.greeting}</p>
              ${highlight}
              ${payload.bodyHtml}
            </td>
          </tr>
          <tr>
            <td style="background-color: #f8fafc; padding: 25px 30px; border-top: 1px solid #e6ecf1; font-size: 12px; color: #627d98; text-align: center; line-height: 1.5;">
              <p style="margin: 0 0 6px 0; font-weight: bold; color: #1e3a5f; font-size: 13px;">${ORG.name}</p>
              <p style="margin: 0 0 4px 0;">ঠিকানা: ${ORG.addressBn}</p>
              <p style="margin: 0 0 4px 0;">ফোন: ${ORG.phone} | ইমেইল: ${ORG.email}</p>
              <p style="margin: 0;">অফিসিয়াল পোর্টাল: <a href="https://${ORG.portal}" style="color: #0b3c5d; font-weight: 600; text-decoration: none;">${ORG.portal}</a></p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;
}

export interface TriggerContext {
  clientId?: string;
  clientName?: string;
  jobCategory?: string;
  countryBn?: string;
  visaBn?: string;
  employerName?: string;
  govCode?: string;
  commission?: string;
  weekLabel?: string;
  decision?: string;
  reason?: string;
  flightDate?: string;
  pnr?: string;
  airline?: string;
  pickupAddress?: string;
  deployedWorkers?: number;
  inProgress?: number;
}

export interface RenderedEmail {
  triggerType: string;
  recipientKind: string;
  subject: string;
  html: string;
}

const mono = (text: string) =>
  `<span style="font-family: monospace; font-weight: 700; color: #0b3c5d;">${text}</span>`;

/** ট্রিগার ভিত্তিক ডাইনামিক ভ্যারিয়েবল প্রতিস্থাপন ইঞ্জিন */
export function renderTrigger(triggerType: string, ctx: TriggerContext): RenderedEmail {
  const name = ctx.clientName ?? "সম্মানিত গ্রাহক";
  const id = ctx.clientId ?? "WVC-XXX-XXX-2026-0000";
  const country = ctx.countryBn ?? "গন্তব্য দেশ";
  const visa = ctx.visaBn ?? "ভিসা";

  const map: Record<string, RenderedEmail> = {
    onboarding_welcome: {
      triggerType,
      recipientKind: "ক্লায়েন্ট",
      subject: `আপনার ফাইল সফলভাবে জমা হয়েছে - আইডি: ${id}`,
      html: renderEmailFrame({
        heading: "প্রিয় গ্রাহক,",
        greeting:
          "আপনার অভিবাসন আবেদনটি সফলভাবে ওয়ার্ল্ড ভিশন কনসালটেন্সির কেন্দ্রীয় সিস্টেমে নথিভুক্ত হয়েছে। আপনার ভিসা প্রসেসিংয়ের প্রতিটি ধাপ স্বচ্ছতার সাথে ট্র্যাক করার জন্য নিচে আপনার ইউনিক আইডি প্রদান করা হলো:",
        highlightLabel: "ট্র্যাকিং রেফারেন্স আইডি:",
        highlightValue: id,
        bodyHtml: `<p>আমাদের স্বয়ংক্রিয় ব্রাউজার এজেন্ট আপনার আপলোডকৃত ডকুমেন্টের সত্যতা নিশ্চিত করে নির্ধারিত পোর্টাল ও দূতাবাসে প্রক্রিয়াটি সম্পাদন করছে। ${mono(country)} — ${mono(visa)} ট্র্যাকে আবেদনের পরবর্তী অগ্রগতি আপনাকে তাৎক্ষণিকভাবে অবহিত করা হবে।</p>`,
      }),
    },
    candidate_match: {
      triggerType,
      recipientKind: "বিদেশি নিয়োগকর্তা",
      subject: `We have a new candidate for your demand - ${ctx.jobCategory ?? "General Worker"} - CV Attached`,
      html: renderEmailFrame({
        heading: "Dear Employer,",
        greeting: `A verified candidate from our pre-screened talent pool has been matched against your approved demand for <strong>${ctx.jobCategory ?? "General Worker"}</strong> in ${ctx.countryBn ?? "your country"}.`,
        highlightLabel: "Candidate Reference:",
        highlightValue: id,
        bodyHtml: `<p style="margin-bottom:0">The attached CV data sheet and passport bio page extract have already passed our OCR/MRZ validation engine (passport validity &gt; 180 days, ICAO photo compliance, sharpness score ≥ 100). Kindly review and issue the employment contract / demand confirmation so that our browser agent can proceed with the work permit submission on ${ctx.countryBn ?? "the official portal"}.</p>`,
      }),
    },
    work_permit_submission: {
      triggerType,
      recipientKind: "ক্লায়েন্ট + নিয়োগকর্তা",
      subject: `Work Permit Application Submitted for ${name}`,
      html: renderEmailFrame({
        heading: "ওয়ার্ক পারমিট আবেদন দাখিল সম্পন্ন,",
        greeting: `${name}-এর ফাইলটি ${country}-এর অফিসিয়াল সরকারি পোর্টালে স্বয়ংক্রিয়ভাবে সাবমিট করা হয়েছে। নিচে গভর্নমেন্ট ট্র্যাকিং রেফারেন্স সংরক্ষণ করুন:`,
        highlightLabel: "গভর্নমেন্ট ট্র্যাকিং কোড:",
        highlightValue: ctx.govCode ?? "PENDING",
        bodyHtml: `<p>নিয়োগকর্তা: ${mono(ctx.employerName ?? "—")}<br>পোর্টাল: ${mono(country)} অফিশিয়াল ই-গভর্নমেন্ট সাবমিশন নোড<br>অ্যাপয়েন্টমেন্ট ও স্ট্যাটাস আপডেট প্রতিদিন তিনবার (০৯:০০ / ১৪:০০ / ২১:০০ BST) স্বয়ংক্রিয়ভাবে স্ক্র্যাপ করা হচ্ছে।</p>`,
      }),
    },
    embassy_submission: {
      triggerType,
      recipientKind: "ক্লায়েন্ট",
      subject: `আপনার ফাইল এম্বাসিতে জমা হয়েছে - ${id}`,
      html: renderEmailFrame({
        heading: "পন্যতনপূর্ণ কনস্যুলার সাবমিশন নোটিশ,",
        greeting: `আপনার পাসপোর্ট ভিসা স্ট্যাম্পিংয়ের জন্য ${country}-এর কনস্যুলার সেকশনে জমা দেওয়া হয়েছে।`,
        highlightLabel: "ফাইল আইডি:",
        highlightValue: id,
        bodyHtml: `<p>স্ট্যাম্পিং পরিস্থিতি পর্যবেক্ষণের জন্য আমাদের স্ক্র্যাপার প্রতি ২৪ ঘণ্টায় পাসপোর্ট নম্বর ইনজেক্ট করে স্ট্যাটাস সিঙ্ক করছে। পাসপোর্ট রিসিভ করার সাথে সাথে আপনাকে এসএমএস ও ইমেইল নোটিফিকেশন প্রেরণ করা হবে।</p>`,
      }),
    },
    affiliate_commission: {
      triggerType,
      recipientKind: "লোকাল অ্যাফিলিয়েট",
      subject: `আপনার রেফার করা ক্লায়েন্ট ${name} এর ফাইল Approved হয়েছে - কমিশন ${ctx.commission ?? "০"} টাকা যোগ হয়েছে`,
      html: renderEmailFrame({
        heading: "অভিনন্দন, কমিশন ক্রেডিট সম্পন্ন!",
        greeting: `আপনার রেফারেল কোডের মাধ্যমে অনবোর্ড হওয়া ক্লায়েন্ট ${name} (${id}) এর ভিসা অনুমোদন সম্পন্ন হয়েছে।`,
        highlightLabel: "ওয়ালেটে যোগ হয়েছে:",
        highlightValue: `৳ ${ctx.commission ?? "0"}`,
        bodyHtml: `<p>এই পরিমাণ আপনার অ্যাফিলিয়েট ওয়ালেট লেজারে তাৎক্ষণিকভাবে ক্রেডিট হয়েছে (${visa} ট্র্যাক)। বিকাশ, নগদ বা ব্যাংক অ্যাকাউন্টে উইথড্রয়াল রিকোয়েস্ট সরাসরি আপনার ড্যাশবোর্ড থেকে পাঠাতে পারবেন; অ্যাডমিন অনুমোদনের পর পেআউট নিষ্পন্ন হয়।</p>`,
      }),
    },
    employer_weekly: {
      triggerType,
      recipientKind: "ফরেন এমপ্লয়ার ও পার্টনার",
      subject: `Weekly Deployment Report - ${ctx.weekLabel ?? "This Week"} (WVC)`,
      html: renderEmailFrame({
        heading: "Weekly Deployment & Processing Summary",
        greeting: `Please find the consolidated weekly progress of all workers processing against your approved demand quota (${ctx.employerName ?? "Partner Account"}).`,
        highlightLabel: "Workers In Progress:",
        highlightValue: `${ctx.inProgress ?? 0} workers`,
        bodyHtml: `<p>Successfully deployed: ${mono(String(ctx.deployedWorkers ?? 0))} workers<br>Medical / Wafid clearance completed: ${mono(String(ctx.deployedWorkers ?? 0))}+<br>Work permits issued: tracked in real time on your employer dashboard.<br><br>Our browser automation cluster continues the 09:00 / 14:00 / 21:00 (BST) appointment and status synchronisation cycle.</p>`,
      }),
    },
    visa_decision: {
      triggerType,
      recipientKind: "ক্লায়েন্ট",
      subject: `${ctx.decision ?? "ভিসা ডিসিশন"} - আপনার ভিসা আবেদনের অফিশিয়াল নোটিশ (${id})`,
      html: renderEmailFrame({
        heading: `${ctx.decision ?? "ভিসা ডিসিশন"} — অফিশিয়াল নোটিশ`,
        greeting: `${name}, আপনার ${country} — ${visa} আবেদনের সিদ্ধান্ত কেন্দ্রীয় সিস্টেমে নথিভুক্ত হয়েছে।`,
        highlightLabel: "ফাইল আইডি:",
        highlightValue: id,
        bodyHtml: ctx.reason
          ? `<p><strong>প্রত্যাখ্যানের কারণ:</strong> ${ctx.reason}<br>আপিল প্রক্রিয়া: ৩০ দিনের মধ্যে পুনর্বিবেচনার আবেদন ও সংশোধিত ডকুমেন্ট জমা দেওয়ার সুযোগ রয়েছে। আমাদের লিগ্যাল টিম সরাসরি সহায়তা প্রদান করবে।</p>`
          : `<p>অভিনন্দন! অনুমোদনের সফটকপি এই ইমেইলের সাথে সংযুক্ত। পরবর্তী ধাপে ফ্লাইট টিকিটিং, গন্তব্য নিয়োগকর্তার যোগাযোগ নিশ্চিতকরণ এবং প্রি-ডিপার্চার ব্রিফিং সম্পন্ন করা হবে।</p>`,
      }),
    },
    flight_briefing: {
      triggerType,
      recipientKind: "ক্লায়েন্ট",
      subject: `চূড়ান্ত ভ্রমণ নোটিশ - ফ্লাইট ${ctx.flightDate ?? "—"} (PNR ${ctx.pnr ?? "—"})`,
      html: renderEmailFrame({
        heading: "চূড়ান্ত ফ্লাইট ও ডিপ্লয়মেন্ট ব্রিফিং,",
        greeting: `${name}, আপনার এয়ারলাইন টিকিট ইস্যু সম্পন্ন হয়েছে। নিচের তথ্য মুদ্রণ করে ভ্রমণের সময় সাথে রাখুন।`,
        highlightLabel: "PNR / ই-টিকিট নম্বর:",
        highlightValue: ctx.pnr ?? "—",
        bodyHtml: `<p>ফ্লাইট তারিখ: ${mono(ctx.flightDate ?? "—")}<br>এয়ারলাইন: ${mono(ctx.airline ?? "—")}<br>এয়ারপোর্ট পিকআপ: ${mono(ctx.pickupAddress ?? "নিয়োগকর্তা কনফার্ম করবেন")}<br><br>জরুরি সহায়তা: ${ORG.phone} | ${ORG.email}<br>আমাদের ২৪/৭ ডেস্ক ট্রানজিটে থাকা অবস্থাতেও সমন্বয় করবে।</p>`,
      }),
    },
  };

  return (
    map[triggerType] ?? {
      triggerType,
      recipientKind: "ক্লায়েন্ট",
      subject: `ওয়ার্ল্ড ভিশন কনসালটেন্সি — সিস্টেম নোটিফিকেশন (${id})`,
      html: renderEmailFrame({
        heading: "সিস্টেম নোটিফিকেশন,",
        greeting: "আপনার ফাইল সংক্রান্ত একটি স্বয়ংক্রিয় সিস্টেম আপডেট প্রেরিত হয়েছে।",
        highlightLabel: "ফাইল আইডি:",
        highlightValue: id,
        bodyHtml: "<p>বিস্তারিত তথ্যের জন্য আপনার ড্যাশবোর্ড ব্যবহার করুন অথবা আমাদের সাপোর্ট ডেস্কে যোগাযোগ করুন।</p>",
      }),
    }
  );
}
