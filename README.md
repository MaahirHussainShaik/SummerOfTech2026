# Summer of Tech 2026 Prototype

This is a **basic prototype** built with **Next.js 13 (App Router)**, **TypeScript**, **TailwindCSS**, and simple AI/NLP logic.  
It re-imagines the Summer of Tech 2026 experience for **students** and **employers**.

---

## 🚀 Setup Instructions (User Flow)

When you open the website:

### 🏠 Home Page
- You will see the hero text *“Summer of Tech 2026”* on the left and the role selector on the right.  
- Select either **Student** or **Employer** from the dropdown.  
- Click **Set Role** (⚠️ this is required).  
- Then, click the corresponding **“Go to …”** button to enter the chosen interface.  

> **Note**: You must click **Set Role** before you can navigate to a page.

---

### 🧑‍🎓 Student Role

1. **Jobs Available**
   - Browse the list of jobs.  
   - Click on an **employer name** to view the full job description.  
   - Each job page also includes a **FAQ section** and a space to add your own **3 custom questions**.  
   - You can **Apply** either directly from the Student Page or after entering the job detail page.  

2. **Applied Jobs**
   - Once you apply, the job automatically appears in the **“Jobs I’ve applied”** list.  

3. **Upload CV**
   - Next, you need to upload your **CV (.txt only)**.  
   - I have attached my own CV for demo purposes.  
   - After uploading, your applied jobs are **ranked** by their match with your CV.  
   - In the **Event Recommendations** section, you will see a guide that tells you which companies to prioritise first at the event.  

   ⚙️ **Ranking implementation (basic in-app scorer)**  
   - The job ranking is based on a **simple TF-IDF + cosine similarity** algorithm (see [`useSimpleScorer`](./lib/useSimpleScorer.tsx)).  
   - It removes stopwords, tokenises the CV and job descriptions, builds TF-IDF vectors, and calculates a similarity score.  
   - Scores are mapped 0–100 and jobs are sorted descending.  
   - This is very basic and not production-ready.  

   👉 For a **better Python implementation**, try the separate demo app:  
   - Streamlit Demo: [CV ↔ JD Matcher](https://cvjdmatcher.streamlit.app/)  
   - GitHub: [MaahirHussainShaik/CVJDMatcher](https://github.com/MaahirHussainShaik/CVJDMatcher.git)

4. **FAQs**
   - Each job has a **Top 7 FAQ page** (the same 7 questions across all jobs).  
   - Students can view employer answers and add their own personal questions.  

5. **Notes + QR Codes**
   - For each applied job, you can download a **QR Code (JSON)** containing your profile + your saved questions.  
   - During the event, upload the **employer’s JSON QR** into the “Scanner & Notes” section.  
   - This will unlock a **notes box** where you can type takeaways, contacts, and follow-ups.  

---

### 🧑‍💼 Employer Role

1. **Select a Role**
   - Employers can switch between different jobs available (via the dropdown).  

2. **Configure FAQs**
   - Each job has the same 7 FAQs.  
   - Employers can type answers and click **Save FAQs**.  
   - For now, answers are saved locally and the UI shows “FAQs saved ✅” (demo only).  

3. **Employer QR**
   - An employer QR (JSON payload) is generated that students can scan to view the company’s FAQs.  
   - Employers can also **download this QR JSON** for use at the booth.  

4. **Scan Student QR**
   - Employers can upload the **student QR JSON** (downloaded from the Student Page).  
   - This starts a **5-minute countdown timer** (for booth conversation).  
   - Displays the student’s **skills + custom questions**.  
   - Employers can select **Approve** or **Not Proceed**.  
   - If “Not Proceed” is chosen, employers can select one or more reasons (e.g. “skills mismatch”).  
   - Submitting records the feedback (demo alert shown).  

---

## ✨ Main Features Implemented

- ✅ Role-based navigation (Student / Employer)  
- ✅ Jobs list with JD detail pages and FAQs  
- ✅ Apply flow synced across pages (localStorage)  
- ✅ Basic CV ↔ JD ranking (TF-IDF cosine similarity)  
- ✅ Demo Python matcher linked for better results  
- ✅ Event recommendation guide (ranked by fit)  
- ✅ Per-job **Student QR codes** with questions + profile  
- ✅ Employer QR codes with FAQs  
- ✅ Scanner & Notes (students uploading employer JSON; employers uploading student JSON)  
- ✅ 5-minute timer + Approve/Not feedback loop for employers  

---

## 🛠️ Tech Stack

- **Next.js 13 (App Router)** — React framework  
- **TypeScript** — type safety  
- **TailwindCSS** — styling & responsive design  
- **qrcode.react** — QR code generation  
- **LocalStorage** — client-side persistence (demo only)  
- **Custom NLP scorer** — TF-IDF cosine similarity (basic CV ↔ JD ranking)  
- **Python Streamlit App** — advanced CV ↔ JD matcher (external demo)  

---

## ⚠️ Known Limitations / Future Improvements

- CV upload limited to **.txt only** (PDF/DOCX parsing disabled in demo).  
- Job ranking is **basic** (TF-IDF overlap only) → could be replaced by embeddings via `@xenova/transformers` or API.  
- No backend persistence — everything is stored in **localStorage**.  
- QR codes are plain **JSON text** (not secure or signed).  
- UI: optimised for desktop; responsive/mobile needs refinement.  
- Accessibility (keyboard navigation, ARIA roles) not fully implemented.  
- “Organiser” role not implemented.  
- Employer feedback not saved to backend; alerts only.  

---

## 📊 User Flow

```mermaid
flowchart TD
    A[Home] -->|Select role + Set Role| B{Role}
    B -->|Student| S1[Student Page]
    B -->|Employer| E1[Employer Page]

    %% Student branch
    S1 --> S2[Browse Jobs]
    S2 -->|View JD + FAQs + add 3 Qs| S3[Job Detail]
    S3 -->|Apply| S4[Applied Jobs (ranked)]
    S1 -->|Apply from list| S4
    S4 --> S5[Upload CV (.txt)]
    S5 --> S6[Jobs Ranked]
    S6 --> S7[Event Recommendations]
    S4 --> S8[Per-job QR (JSON) + Notes]

    %% Employer branch
    E1 --> E2[Pick a Job]
    E2 --> E3[Edit & Save 7 FAQs]
    E2 --> E4[Employer QR (JSON)]
    E1 --> E5[Scan Student QR (upload JSON)]
    E5 --> E6[View Student Profile + Their Questions + 5-min Timer]
