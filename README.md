# HRS System

خطوات سريعة لرفع المشروع والعمل عليه من GitHub ثم نشره على سحابة:

1. تهيئة git ورفع المشروع:
   - git init
   - git add .
   - git commit -m "Initial commit"
   - أنشئ مستودع على GitHub ثم:
   - git remote add origin <GIT_URL>
   - git push -u origin main

2. إعداد متغيرات البيئة:
   - محلياً ضع ملف `.env` مطابق لـ `.env.example`.
   - على منصة النشر (Render / Railway / Heroku) أضف المتغيرات: ADMIN_PASSWORD, USER_PASSWORD, PORT.

3. نشر تلقائي:
   - في Render أو Railway: اربط حساب GitHub واختر المستودع، فعّل Auto Deploy. المنصة ستشغل `npm start` تلقائياً.
   - على Heroku: أنشئ تطبيق، اربط المستودع وفعل Deploy from GitHub، أو استخدم `git push heroku main`.

4. ملاحظة:
   - لا تقم برفع ملفات حساسة (مثل `.env`) إلى GitHub.
   - لتحرير الموقع "أساسياً" بعد رفعه: قم بالتعديل في المستودع على GitHub (واجهة الويب أو عبر PR) وسيقوم نظام الـ CI/CD للنشر بتطبيق التغييرات على الخادم إذا فعلت النشر التلقائي.
