// === PWA (MOBİL UYGULAMA) SERVICE WORKER KAYDI ===
if ('serviceWorker' in navigator) {
    window.addEventListener('load', () => {
        navigator.serviceWorker.register('./sw.js').then(reg => {
            console.log('Service Worker başarıyla kaydedildi.');
        }).catch(err => console.log('Service Worker hatası:', err));
    });
}

// === FİREBASE MODÜLLERİ (Google Auth, Password Reset ve onSnapshot Eklendi) ===
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.11.0/firebase-app.js";
import { getFirestore, collection, addDoc, doc, getDoc, setDoc, deleteDoc, updateDoc, query, where, onSnapshot } from "https://www.gstatic.com/firebasejs/10.11.0/firebase-firestore.js";
import { getAuth, createUserWithEmailAndPassword, signInWithEmailAndPassword, onAuthStateChanged, signOut, updateProfile, GoogleAuthProvider, signInWithPopup, sendPasswordResetEmail } from "https://www.gstatic.com/firebasejs/10.11.0/firebase-auth.js";

const firebaseConfig = {
  apiKey: "AIzaSyDhODKBlHe1QfcYpC72PUrQFvh8Gm38HDY",
  authDomain: "budget-tracker-78ce8.firebaseapp.com",
  projectId: "budget-tracker-78ce8",
  storageBucket: "budget-tracker-78ce8.firebasestorage.app",
  messagingSenderId: "716361424148",
  appId: "1:716361424148:web:063a45e848b68ec2afb601",
  measurementId: "G-6BX5FZY7TP"
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);
const auth = getAuth(app); 
const googleProvider = new GoogleAuthProvider();

document.addEventListener('DOMContentLoaded', () => {
    
    let tables = [];
    let currentTable = ""; 
    let expenses = [];
    let categories = [];
    let editingExpenseId = null; 
    let expenseChartInstance = null;
    let currentUser = null; 
    let currentGroupId = null; 
    let userWorkspaces = []; 

    let deleteTargetType = ""; 
    let deleteTargetId = "";   
    let tableToEditOldName = "";

    // DOM Elemanları (Genel)
    const authContainer = document.getElementById('auth-container');
    const appContainer = document.getElementById('app-container');
    const authEmail = document.getElementById('auth-email');
    const authPassword = document.getElementById('auth-password');
    const loginBtn = document.getElementById('login-btn');
    const googleLoginBtn = document.getElementById('google-login-btn');
    const openRegisterModalBtn = document.getElementById('open-register-modal-btn');
    const logoutBtn = document.getElementById('logout-btn');
    const userEmailDisplay = document.getElementById('user-email-display');
    const currentWorkspaceDisplay = document.getElementById('current-workspace-display');
    
    // YENİ: Filtreleme DOM Elemanları
    const toggleFilterBtn = document.getElementById('toggle-filter-btn');
    const filterPanel = document.getElementById('filter-panel');
    const filterCategory = document.getElementById('filter-category');
    const filterUser = document.getElementById('filter-user');
    const clearFilterBtn = document.getElementById('clear-filter-btn');

    // DOM (Kayıt, Şifre, Yasal)
    const registerModal = document.getElementById('register-modal');
    const regName = document.getElementById('reg-name');
    const regSurname = document.getElementById('reg-surname');
    const regEmail = document.getElementById('reg-email');
    const regPassword = document.getElementById('reg-password');
    const regTerms = document.getElementById('reg-terms');
    const registerSubmitBtn = document.getElementById('register-submit-btn');
    const registerCancelBtn = document.getElementById('register-cancel-btn');
    const forgotPasswordLink = document.getElementById('forgot-password-link');
    const forgotPasswordModal = document.getElementById('forgot-password-modal');
    const sendResetBtn = document.getElementById('send-reset-btn');
    const closeResetBtn = document.getElementById('close-reset-btn');
    const openTermsBtn = document.getElementById('open-terms-btn');
    const openPrivacyBtn = document.getElementById('open-privacy-btn');
    const legalModal = document.getElementById('legal-modal');
    const legalTitle = document.getElementById('legal-title');
    const legalBody = document.getElementById('legal-body');
    const closeLegalBtn = document.getElementById('close-legal-btn');

    // DOM (Sidebar, Menü ve Alanlar)
    const openGroupModalBtn = document.getElementById('open-group-modal-btn');
    const groupModal = document.getElementById('group-modal');
    const closeGroupModalBtn = document.getElementById('close-group-modal-btn');
    const myGroupCodeDisplay = document.getElementById('my-group-code');
    const joinGroupInput = document.getElementById('join-group-input');
    const joinGroupBtn = document.getElementById('join-group-btn');
    const exportExcelBtn = document.getElementById('export-excel-btn');
    const openFeedbackBtn = document.getElementById('open-feedback-btn');
    const openSupportBtn = document.getElementById('open-support-btn');

    // DOM (İçerik ve Modallar)
    const monthSelect = document.getElementById('month-select');
    const newTableBtn = document.getElementById('new-table-btn');
    const expenseList = document.getElementById('expense-list');
    const summaryList = document.getElementById('summary-list');
    const totalDisplay = document.getElementById('total-display');
    const fabBtn = document.getElementById('fab-btn');
    const chartContainer = document.getElementById('chart-container');
    const expenseModal = document.getElementById('expense-modal');
    const modalTitle = document.getElementById('modal-title');
    const cancelBtn = document.getElementById('cancel-btn');
    const saveBtn = document.getElementById('save-btn');
    const inputTable = document.getElementById('input-table');
    const inputAmount = document.getElementById('input-amount');
    const inputCurrency = document.getElementById('input-currency');
    const inputCategory = document.getElementById('input-category');
    const inputDesc = document.getElementById('input-desc');
    const inputDate = document.getElementById('input-date');
    const addCategoryBtn = document.getElementById('add-category-btn');
    const tabActive = document.getElementById('tab-active');
    const tabSummary = document.getElementById('tab-summary');
    const expenseView = document.getElementById('expense-view');
    const summaryView = document.getElementById('summary-view');
    const newMonthModal = document.getElementById('new-month-modal');
    const inputNewMonth = document.getElementById('input-new-month');
    const saveMonthBtn = document.getElementById('save-month-btn');
    const cancelMonthBtn = document.getElementById('cancel-month-btn');
    const newCategoryModal = document.getElementById('new-category-modal');
    const inputNewCategory = document.getElementById('input-new-category');
    const saveCategoryBtn = document.getElementById('save-category-btn');
    const cancelCategoryBtn = document.getElementById('cancel-category-btn');
    const confirmModal = document.getElementById('confirm-modal');
    const confirmMessage = document.getElementById('confirm-message');
    const confirmYesBtn = document.getElementById('confirm-yes-btn');
    const confirmNoBtn = document.getElementById('confirm-no-btn');
    const editTableModal = document.getElementById('edit-table-modal');
    const inputEditTableName = document.getElementById('input-edit-table-name');
    const saveEditTableBtn = document.getElementById('save-edit-table-btn');
    const cancelEditTableBtn = document.getElementById('cancel-edit-table-btn');

    function getCategoryIcon(catName) {
        const lowerCat = catName.toLowerCase();
        if(lowerCat.includes("benzin") || lowerCat.includes("yakıt")) return "fa-gas-pump";
        if(lowerCat.includes("kumanya") || lowerCat.includes("market")) return "fa-cart-shopping";
        if(lowerCat.includes("yemek") || lowerCat.includes("restoran")) return "fa-utensils";
        if(lowerCat.includes("fatura") || lowerCat.includes("elektrik")) return "fa-file-invoice-dollar";
        if(lowerCat.includes("giyim") || lowerCat.includes("kıyafet")) return "fa-shirt";
        return "fa-tag"; 
    }

    // === 1. KİMLİK DOĞRULAMA (GOOGLE & MAİL) ===
    function translateAuthError(errorCode) {
        switch (errorCode) {
            case 'auth/email-already-in-use': return "Bu e-posta adresi zaten kullanımda.";
            case 'auth/invalid-email': return "Geçersiz bir e-posta formatı girdiniz.";
            case 'auth/weak-password': return "Şifreniz çok zayıf. En az 6 karakter belirleyin.";
            case 'auth/user-not-found': return "Hesap bulunamadı.";
            case 'auth/wrong-password': return "Şifreniz hatalı.";
            case 'auth/invalid-credential': return "E-posta veya şifre hatalı.";
            default: return "Bir hata oluştu: " + errorCode;
        }
    }

    onAuthStateChanged(auth, async (user) => {
        if (user) {
            currentUser = user;
            authContainer.classList.add('hidden'); 
            appContainer.classList.remove('hidden'); 
            
            const displayName = user.displayName ? user.displayName : user.email.split('@')[0];
            userEmailDisplay.innerHTML = displayName;

            // Workspace (Çalışma Alanı) Göç ve Okuma Mantığı
            const userRef = doc(db, "kullanicilar", user.uid);
            const userSnap = await getDoc(userRef);
            let userData = userSnap.data() || {};
            
            if(!userData.workspaces) {
                userData.workspaces = [{ id: user.uid, name: "Kendi Alanım" }];
                if (userData.groupId && userData.groupId !== user.uid) {
                    userData.workspaces.push({ id: userData.groupId, name: "Ortak Alan (" + userData.groupId.substring(0,4) + ")" });
                }
                userData.activeWorkspace = userData.groupId || user.uid;
                await setDoc(userRef, { email: user.email, workspaces: userData.workspaces, activeWorkspace: userData.activeWorkspace }, { merge: true });
            }
            
            userWorkspaces = userData.workspaces;
            currentGroupId = userData.activeWorkspace;
            
            updateWorkspaceUI();
            fetchInitialData(); 
        } else {
            currentUser = null; currentGroupId = null; userWorkspaces = [];
            appContainer.classList.add('hidden');
            authContainer.classList.remove('hidden');
            expenses = []; tables = []; categories = []; 
        }
    });

    // Google ile Giriş
    if(googleLoginBtn) {
        googleLoginBtn.addEventListener('click', async () => {
            try { await signInWithPopup(auth, googleProvider); } 
            catch (error) { alert("Google ile giriş iptal edildi veya başarısız oldu."); }
        });
    }

    // Şifremi Unuttum
    if(forgotPasswordLink) {
        forgotPasswordLink.addEventListener('click', (e) => { e.preventDefault(); forgotPasswordModal.classList.remove('hidden'); });
        closeResetBtn.addEventListener('click', () => forgotPasswordModal.classList.add('hidden'));
        sendResetBtn.addEventListener('click', async () => {
            const email = document.getElementById('reset-email').value;
            if(!email) return alert("Lütfen e-posta adresinizi girin.");
            try {
                await sendPasswordResetEmail(auth, email);
                alert("Şifre sıfırlama bağlantısı e-posta adresinize gönderildi.");
                forgotPasswordModal.classList.add('hidden');
            } catch (error) { alert(translateAuthError(error.code)); }
        });
    }

    // Normal Giriş ve Kayıt
    loginBtn.addEventListener('click', async () => {
        const email = authEmail.value; const password = authPassword.value;
        if(!email || !password) return alert("Lütfen boş alan bırakmayın.");
        try { await signInWithEmailAndPassword(auth, email, password); } catch (error) { alert(translateAuthError(error.code)); }
    });

    openRegisterModalBtn.addEventListener('click', () => {
        regName.value = ""; regSurname.value = ""; regEmail.value = ""; regPassword.value = ""; regTerms.checked = false; 
        registerModal.classList.remove('hidden');
    });
    registerCancelBtn.addEventListener('click', () => registerModal.classList.add('hidden'));

    registerSubmitBtn.addEventListener('click', async () => {
        const name = regName.value.trim(); const surname = regSurname.value.trim();
        const email = regEmail.value.trim(); const password = regPassword.value;
        if(!regTerms.checked) return alert("Kayıt olmak için Sözleşmeleri kabul etmelisiniz.");
        if(!name || !surname || !email || !password) return alert("Tüm alanları doldurun.");
        if(password.length < 6) return alert("Şifre en az 6 karakter olmalıdır.");
        registerSubmitBtn.innerHTML = "Kaydediliyor..."; registerSubmitBtn.disabled = true;
        try {
            const cred = await createUserWithEmailAndPassword(auth, email, password);
            await updateProfile(cred.user, { displayName: `${name} ${surname}` });
            registerModal.classList.add('hidden');
        } catch (error) { alert(translateAuthError(error.code)); } 
        finally { registerSubmitBtn.innerHTML = "Kaydı Tamamla"; registerSubmitBtn.disabled = false; }
    });

    logoutBtn.addEventListener('click', async () => await signOut(auth));

    // Yasal Metinler (Sözleşmeler)
    const showLegalInfo = (type) => {
        legalTitle.innerText = type === 'terms' ? "Kullanım Koşulları" : "Gizlilik Politikası (KVKK)";
        legalBody.innerHTML = type === 'terms' ? 
            "<p>Bu uygulamayı kullanarak tüm yasal sorumluluğun tarafınıza ait olduğunu kabul edersiniz. Girdiğiniz veriler bulut ortamında şifrelenerek saklanmaktadır.</p>" : 
            "<p>Kişisel verileriniz (E-posta ve Ad Soyad), yalnızca kimlik doğrulama ve grup senkronizasyonu amacıyla işlenmektedir. Üçüncü şahıslarla paylaşılmaz.</p>";
        legalModal.classList.remove('hidden');
    }
    if(openTermsBtn) openTermsBtn.addEventListener('click', (e) => { e.preventDefault(); showLegalInfo('terms'); });
    if(openPrivacyBtn) openPrivacyBtn.addEventListener('click', (e) => { e.preventDefault(); showLegalInfo('privacy'); });
    if(closeLegalBtn) closeLegalBtn.addEventListener('click', () => legalModal.classList.add('hidden'));

    // Geri Bildirim ve Destek
    if(openSupportBtn) openSupportBtn.addEventListener('click', () => alert("Destek merkezi paneli yakında aktif edilecektir!"));

    // === 2. ÇALIŞMA ALANLARI (WORKSPACES) MİMARİSİ ===
    function updateWorkspaceUI() {
        const activeWs = userWorkspaces.find(w => w.id === currentGroupId);
        if(currentWorkspaceDisplay) currentWorkspaceDisplay.innerText = activeWs ? activeWs.name : "Ortak Alan";
        if(myGroupCodeDisplay) myGroupCodeDisplay.innerText = currentUser.uid; 

        const groupListContainer = document.getElementById('dynamic-workspace-list');
        
        if(!groupListContainer && groupModal) {
            const listHtml = `
                <div id="dynamic-workspace-list" style="margin-top:25px; text-align:left;">
                    <label style="font-size:0.75em; color:#888; font-weight:700; text-transform:uppercase; letter-spacing:1px;">Kayıtlı Çalışma Alanları</label>
                    <div id="ws-buttons-container" style="display:flex; flex-direction:column; gap:10px; margin-top:10px;"></div>
                </div>
            `;
            joinGroupInput.parentElement.insertAdjacentHTML('afterend', listHtml);
        }
        
        const wsContainer = document.getElementById('ws-buttons-container');
        if(wsContainer) {
            wsContainer.innerHTML = '';
            userWorkspaces.forEach(ws => {
                const isActive = ws.id === currentGroupId;
                const btn = document.createElement('button');
                btn.className = isActive ? 'workspace-card-btn active' : 'workspace-card-btn';
                
                btn.innerHTML = `
                    <div style="display: flex; align-items: center; gap: 15px;">
                        <div style="width: 40px; height: 40px; border-radius: 10px; background: ${isActive ? 'var(--theme-color)' : 'var(--background-color)'}; color: ${isActive ? 'white' : 'var(--color)'}; display: flex; align-items: center; justify-content: center; font-size: 1.2em;">
                            <i class="fa-solid ${ws.id === currentUser.uid ? 'fa-user' : 'fa-users'}"></i>
                        </div>
                        <div style="flex: 1; text-align: left;">
                            <strong style="display: block; font-size: 1.05em; color: var(--color); margin-bottom: 2px;">${ws.name}</strong>
                            <span style="font-size: 0.8em; color: #888;">${ws.id === currentUser.uid ? 'Kişisel Kasanız' : 'Ortak Kasa'}</span>
                        </div>
                        ${isActive ? '<i class="fa-solid fa-circle-check" style="color: var(--theme-color); font-size: 1.5em;"></i>' : ''}
                    </div>
                `;
                
                btn.onclick = async () => {
                    await switchWorkspace(ws.id);
                    groupModal.classList.add('hidden');
                };
                wsContainer.appendChild(btn);
            });
        }
    }

    async function switchWorkspace(newGroupId) {
        if(currentGroupId === newGroupId) return;
        currentGroupId = newGroupId;
        await updateDoc(doc(db, "kullanicilar", currentUser.uid), { activeWorkspace: newGroupId });
        updateWorkspaceUI();
        alert("Çalışma alanı değiştirildi.");
        fetchInitialData();
    }

    openGroupModalBtn.addEventListener('click', () => groupModal.classList.remove('hidden'));
    closeGroupModalBtn.addEventListener('click', () => groupModal.classList.add('hidden'));

    joinGroupBtn.addEventListener('click', async () => {
        const code = joinGroupInput.value.trim();
        if(!code) return alert("Lütfen bir grup kodu girin.");
        if(userWorkspaces.find(w => w.id === code)) return alert("Zaten bu gruba kayıtlısınız.");
        
        try {
            const groupName = prompt("Bu grup için bir isim belirleyin (Örn: Ev Bütçesi):", "Ortak Alan") || "Ortak Alan";
            userWorkspaces.push({ id: code, name: groupName });
            
            await updateDoc(doc(db, "kullanicilar", currentUser.uid), { workspaces: userWorkspaces, activeWorkspace: code });
            currentGroupId = code;
            updateWorkspaceUI();
            alert("Gruba başarıyla katıldınız!");
            groupModal.classList.add('hidden');
            joinGroupInput.value = "";
            fetchInitialData(); 
        } catch (error) { alert("Gruba katılırken hata oluştu."); }
    });

    // === 3. GERÇEK ZAMANLI VERİ ÇEKME ===
    let unsubSettings = null;
    let unsubExpenses = null;

    function fetchInitialData() {
        if(!currentGroupId) return;
        
        if(unsubSettings) unsubSettings();
        if(unsubExpenses) unsubExpenses();

        const settingsRef = doc(db, "ayarlar", currentGroupId);
        unsubSettings = onSnapshot(settingsRef, (settingsSnap) => {
            if (settingsSnap.exists()) {
                tables = settingsSnap.data().tables || ["Genel Bütçe"];
                categories = settingsSnap.data().categories || ["Market", "Fatura", "Benzin"];
            } else {
                tables = ["Genel Bütçe"];
                categories = ["Market", "Fatura", "Benzin"];
                setDoc(settingsRef, { tables, categories }, { merge: true });
            }
            if (!currentTable || !tables.includes(currentTable)) currentTable = tables[0];
            renderTables(); renderCategories();
            if(!summaryView.classList.contains('hidden')) renderSummary();
        });

        const q = query(collection(db, "harcamalar"), where("groupId", "==", currentGroupId));
        unsubExpenses = onSnapshot(q, (querySnapshot) => {
            expenses = []; 
            querySnapshot.forEach((doc) => { expenses.push({ id: doc.id, ...doc.data() }); });
            renderExpenses();
            if(!summaryView.classList.contains('hidden')) renderSummary();
        });
    }

    // === 4. EXCEL EXPORT (ÇOKLU SAYFA) ===
    if(exportExcelBtn) {
        exportExcelBtn.addEventListener('click', () => {
            if (expenses.length === 0) return alert("Dışa aktarılacak harcama bulunamadı.");
            
            const workbook = XLSX.utils.book_new();
            let addedSheetCount = 0;

            tables.forEach(tableName => {
                const tableExpenses = expenses.filter(e => e.table === tableName);
                if (tableExpenses.length === 0) return;

                const excelData = tableExpenses.sort((a,b) => new Date(b.date) - new Date(a.date)).map(exp => ({
                    "Tarih": exp.date,
                    "Kategori": exp.category,
                    "Açıklama": exp.desc,
                    "Tutar": Number(exp.amount),
                    "Birim": exp.currency,
                    "Ekleyen": exp.userName
                }));

                const worksheet = XLSX.utils.json_to_sheet(excelData);
                const safeSheetName = tableName.substring(0, 30).replace(/[*?\]\[\/\/]/g, ''); 
                
                XLSX.utils.book_append_sheet(workbook, worksheet, safeSheetName);
                addedSheetCount++;
            });

            if (addedSheetCount === 0) return alert("Tablolarda aktarılacak veri bulunamadı.");
            XLSX.writeFile(workbook, `Butcem_Tum_Tablolar_Raporu.xlsx`);
        });
    }

    // === 5. SİLME VE DÜZENLEME MANTIĞI ===
    function requestDeleteExpense(expenseId) {
        deleteTargetType = "expense"; deleteTargetId = expenseId;
        confirmMessage.innerText = "Bu harcamayı silmek istediğinize emin misiniz?";
        confirmModal.classList.remove('hidden');
    }

    function requestDeleteTable(tableName) {
        deleteTargetType = "table"; deleteTargetId = tableName;
        confirmMessage.innerText = `DİKKAT: "${tableName}" ve içindeki tüm harcamalar kalıcı olarak silinecek. Emin misiniz?`;
        confirmModal.classList.remove('hidden');
    }

    confirmNoBtn.addEventListener('click', () => { confirmModal.classList.add('hidden'); });

    confirmYesBtn.addEventListener('click', async () => {
        const originalText = confirmYesBtn.innerHTML;
        confirmYesBtn.innerHTML = "Siliniyor..."; confirmYesBtn.disabled = true;
        try {
            if (deleteTargetType === "expense") {
                await deleteDoc(doc(db, "harcamalar", deleteTargetId));
            } else if (deleteTargetType === "table") {
                const newTables = tables.filter(t => t !== deleteTargetId);
                await setDoc(doc(db, "ayarlar", currentGroupId), { tables: newTables.length > 0 ? newTables : ["Genel Bütçe"], categories }, { merge: true });
                const expensesToDelete = expenses.filter(e => e.table === deleteTargetId);
                for (const exp of expensesToDelete) { await deleteDoc(doc(db, "harcamalar", exp.id)); }
            }
            confirmModal.classList.add('hidden');
        } catch (error) { alert("İşlem başarısız!"); } 
        finally { confirmYesBtn.innerHTML = originalText; confirmYesBtn.disabled = false; }
    });

    function openEditTableModal(oldName) {
        tableToEditOldName = oldName; inputEditTableName.value = oldName; editTableModal.classList.remove('hidden');
    }

    cancelEditTableBtn.addEventListener('click', () => editTableModal.classList.add('hidden'));

    saveEditTableBtn.addEventListener('click', async () => {
        const newName = inputEditTableName.value.trim();
        if (!newName || newName === tableToEditOldName) return editTableModal.classList.add('hidden');
        if (tables.includes(newName)) return alert("Bu isimde bir tablo zaten var!");

        const originalText = saveEditTableBtn.innerHTML;
        saveEditTableBtn.innerHTML = "Güncelleniyor..."; saveEditTableBtn.disabled = true;
        try {
            let updatedTables = [...tables];
            const index = updatedTables.indexOf(tableToEditOldName);
            if (index !== -1) updatedTables[index] = newName;
            
            await setDoc(doc(db, "ayarlar", currentGroupId), { tables: updatedTables, categories }, { merge: true });
            const expensesToUpdate = expenses.filter(e => e.table === tableToEditOldName);
            for (const exp of expensesToUpdate) { await updateDoc(doc(db, "harcamalar", exp.id), { table: newName }); }
            
            currentTable = newName; editTableModal.classList.add('hidden');
        } catch (error) { alert("Hata!"); } 
        finally { saveEditTableBtn.innerHTML = originalText; saveEditTableBtn.disabled = false; }
    });

    // === EKRAN ÇİZİM VE GRAFİK ===
    function renderChart(currentExpenses) {
        if (!chartContainer) return;
        if(currentExpenses.length === 0) { chartContainer.classList.add('hidden'); return; } 
        else { chartContainer.classList.remove('hidden'); }

        const categoryTotals = {};
        let chartTotal = 0;
        
        currentExpenses.forEach(exp => { 
            const val = Number(exp.amount || 0);
            categoryTotals[exp.category || "Belirtilmedi"] = (categoryTotals[exp.category || "Belirtilmedi"] || 0) + val; 
            chartTotal += val;
        });

        Chart.register(ChartDataLabels);
        if (expenseChartInstance) expenseChartInstance.destroy();
        const ctx = document.getElementById('expenseChart').getContext('2d');
        
        // Göz yormayan, ciddi ve tok SaaS renk paleti (Neon içermez)
        const profColors = ['#ff4522', '#5c7cfa', '#20c997', '#fab005', '#868e96', '#ced4da', '#f06595'];

        // YENİ: Grafiğin ortasına "Toplam" yazan özel eklenti
        const centerTextPlugin = {
            id: 'centerText',
            beforeDraw: function(chart) {
                const width = chart.width, height = chart.height, ctx = chart.ctx;
                ctx.restore();
                
                // Üstteki gri "Toplam" yazısı
                ctx.font = "600 " + (height / 250).toFixed(2) + "em system-ui";
                ctx.textBaseline = "bottom";
                ctx.fillStyle = "#888";
                const title = "Toplam";
                ctx.fillText(title, Math.round((width - ctx.measureText(title).width) / 2), height / 2 - 5);

                // Alttaki turuncu tutar yazısı
                ctx.font = "bold " + (height / 130).toFixed(2) + "em system-ui";
                ctx.textBaseline = "top";
                ctx.fillStyle = "#ff4522";
                const text = chartTotal + " ₺";
                ctx.fillText(text, Math.round((width - ctx.measureText(text).width) / 2), height / 2 + 5);
                ctx.save();
            }
        };

        expenseChartInstance = new Chart(ctx, {
            type: 'doughnut', 
            data: { 
                labels: Object.keys(categoryTotals), 
                datasets: [{ 
                    data: Object.values(categoryTotals), 
                    backgroundColor: profColors, 
                    borderWidth: 0, 
                    borderRadius: 20, // Dilim uçlarını tamamen yuvarladık
                    spacing: 3, 
                    hoverOffset: 4  
                }] 
            },
            plugins: [centerTextPlugin], // Yazı eklentisini aktif ettik
            options: { 
                responsive: true, 
                maintainAspectRatio: false, 
                cutout: '82%', // Çok ince ve zarif bir halka
                layout: { padding: 30 }, 
                plugins: { 
                    legend: { display: false }, // Klasik lejantı tamamen gizledik, sadece rozetler kalacak
                    datalabels: {
                        color: '#fff',
                        backgroundColor: function(context) { return context.dataset.backgroundColor[context.dataIndex]; },
                        borderRadius: 12, // Kapsül şeklinde modern rozetler
                        padding: { top: 6, bottom: 6, left: 10, right: 10 },
                        font: { weight: '600', size: 11, family: 'system-ui' },
                        formatter: function(value) { return value + ' ₺'; },
                        anchor: 'end',
                        align: 'end', 
                        offset: 6,
                        borderWidth: 0
                    }
                } 
            }
        });
    }

    function renderTables() {
        if (!monthSelect) return;
        monthSelect.innerHTML = ''; 
        tables.forEach(table => {
            const option = document.createElement('option');
            option.value = table; option.innerText = table;
            if (table === currentTable) option.selected = true; 
            monthSelect.appendChild(option);
        });
    }

    function renderCategories() {
        if (!inputCategory) return;
        inputCategory.innerHTML = ''; 
        categories.forEach(cat => {
            const option = document.createElement('option'); option.value = cat; option.innerText = cat; inputCategory.appendChild(option);
        });
    }

    expenseList.addEventListener('click', (e) => {
        const editBtn = e.target.closest('.edit-btn'); if (editBtn) editExpenseData(editBtn.getAttribute('data-id'));
        const deleteBtn = e.target.closest('.delete-btn'); if (deleteBtn) requestDeleteExpense(deleteBtn.getAttribute('data-id'));
    });

    function renderExpenses() {
        if (!expenseList) return;
        expenseList.innerHTML = ''; 
        
        // 1. Filtre dropdownlarını mevcut verilerle doldur (Kategori ve Kullanıcılar)
        if(filterCategory && filterCategory.options.length <= 1) {
            categories.forEach(cat => { const opt = document.createElement('option'); opt.value = cat; opt.innerText = cat; filterCategory.appendChild(opt); });
        }
        
        const allTableExpenses = expenses.filter(exp => exp.table === currentTable);
        const uniqueUsers = [...new Set(allTableExpenses.map(e => e.userName || "Bilinmiyor"))];
        
        if(filterUser) {
            const currentUserSelection = filterUser.value;
            filterUser.innerHTML = '<option value="">Tümü</option>'; 
            uniqueUsers.forEach(user => { const opt = document.createElement('option'); opt.value = user; opt.innerText = user; filterUser.appendChild(opt); });
            filterUser.value = uniqueUsers.includes(currentUserSelection) ? currentUserSelection : "";
        }

        // 2. Seçili filtre değerlerini al
        const selectedCat = filterCategory ? filterCategory.value : "";
        const selectedUser = filterUser ? filterUser.value : "";

        // 3. Verileri Filtrele
        const currentExpenses = allTableExpenses
            .filter(exp => selectedCat === "" || exp.category === selectedCat)
            .filter(exp => selectedUser === "" || (exp.userName || "Bilinmiyor") === selectedUser)
            .sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0));

        let totalAmount = 0;

        currentExpenses.forEach(exp => {
            totalAmount += Number(exp.amount || 0);
            const expenseItem = document.createElement('div');
            expenseItem.className = 'expense-item'; 
            expenseItem.innerHTML = `
                <div style="flex: 1; display: flex; align-items: center;">
                    <i class="fa-solid ${getCategoryIcon(exp.category || "")} cat-icon"></i>
                    <div>
                        <strong style="display:block; font-size: 1.1em; margin-bottom: 2px;">${exp.desc || "Açıklama Yok"}</strong>
                        <small style="color: #666; font-size: 0.85em;">${exp.category || ""} | ${exp.date} <span style="opacity:0.6; margin-left:5px;"><i class="fa-solid fa-user-pen"></i> ${exp.userName || "Bilinmiyor"}</span></small>
                    </div>
                </div>
                <div style="font-size: 1.2em; font-weight: bold; color: var(--theme-color); display: flex; align-items: center;">
                    ${exp.amount} ${exp.currency || "₺"}
                    <div class="action-buttons">
                        <button class="icon-btn edit-btn" data-id="${exp.id}" title="Düzenle"><i class="fa-solid fa-pen"></i></button>
                        <button class="icon-btn delete-btn" data-id="${exp.id}" title="Harcamayı Sil"><i class="fa-solid fa-trash"></i></button>
                    </div>
                </div>
            `;
            expenseList.appendChild(expenseItem);
        });
        if (totalDisplay) totalDisplay.innerText = `Toplam: ${totalAmount} ₺`;
        renderChart(currentExpenses); 
    }

    function renderSummary() {
        if (!summaryList) return;
        summaryList.innerHTML = ''; 
        
        tables.forEach(table => {
            const monthExpenses = expenses.filter(exp => exp.table === table);
            const monthTotal = monthExpenses.reduce((sum, current) => sum + Number(current.amount || 0), 0);
            const txCount = monthExpenses.length;
            
            // En çok harcama yapılan kategoriyi hesaplayan zeka
            let topCat = "Harcama Yok";
            let topCatTotal = 0;
            
            if (txCount > 0) {
                const catTotals = {};
                monthExpenses.forEach(e => { catTotals[e.category] = (catTotals[e.category] || 0) + Number(e.amount || 0); });
                const sortedCats = Object.entries(catTotals).sort((a, b) => b[1] - a[1]);
                topCat = sortedCats[0][0];
                topCatTotal = sortedCats[0][1];
            }

            const card = document.createElement('div');
            card.className = 'summary-card';
            card.innerHTML = `
                <div class="summary-card-header clickable-table" data-table="${table}" style="cursor:pointer;" title="Tabloyu İncele">
                    <div style="font-size:1.1em; font-weight:800; display:flex; align-items:center; gap:10px; color: var(--color);">
                        <i class="fa-solid fa-folder-open" style="color:var(--theme-color); font-size: 1.2em;"></i> ${table}
                    </div>
                    <div style="color:var(--theme-color); font-size:1.3em; font-weight:900;">${monthTotal} ₺</div>
                </div>
                <div class="summary-card-body clickable-table" data-table="${table}" style="cursor:pointer;">
                    <div class="summary-stat"><span>Toplam İşlem:</span> <strong>${txCount} Harcama</strong></div>
                    <div class="summary-stat"><span>En Yüksek Kategori:</span> <strong>${topCat} (${topCatTotal} ₺)</strong></div>
                </div>
                <div class="summary-card-footer">
                    <button class="secondary-btn clickable-table" data-table="${table}" style="padding: 6px 15px; font-size: 0.85em; border: none; background: rgba(0,0,0,0.05);"><i class="fa-solid fa-arrow-right"></i> İncele</button>
                    <div class="action-buttons" style="opacity: 1; margin:0;">
                        <button class="icon-btn edit-btn edit-table-btn" data-table="${table}" title="Tablo Adını Düzenle"><i class="fa-solid fa-pen"></i></button>
                        <button class="icon-btn delete-btn delete-table-btn" data-table="${table}" title="Tabloyu Sil"><i class="fa-solid fa-trash"></i></button>
                    </div>
                </div>
            `;
            summaryList.appendChild(card);
        });

        // Tıklama Olayları
        document.querySelectorAll('.clickable-table').forEach(item => item.addEventListener('click', (e) => { 
            currentTable = e.currentTarget.getAttribute('data-table'); 
            tabActive.click(); 
            if(monthSelect) monthSelect.value = currentTable; // Dropdown'ı da eşitle
        }));
        
        // Düzenle/Sil butonlarına tıklayınca kartın içine girmesini engelleyen "stopPropagation" eklentisi
        document.querySelectorAll('.delete-table-btn').forEach(btn => btn.addEventListener('click', (e) => {
            e.stopPropagation(); 
            requestDeleteTable(e.currentTarget.getAttribute('data-table'));
        }));
        document.querySelectorAll('.edit-table-btn').forEach(btn => btn.addEventListener('click', (e) => {
            e.stopPropagation();
            openEditTableModal(e.currentTarget.getAttribute('data-table'));
        }));
    }

    function editExpenseData(expenseId) {
        const exp = expenses.find(e => e.id === expenseId);
        if(!exp) return;
        inputTable.value = exp.table; inputAmount.value = exp.amount; inputCurrency.value = exp.currency; inputCategory.value = exp.category; inputDesc.value = exp.desc; inputDate.value = exp.date;
        editingExpenseId = expenseId; modalTitle.innerText = "Harcama Düzenle"; saveBtn.innerHTML = '<i class="fa-solid fa-floppy-disk"></i> Güncelle'; expenseModal.classList.remove('hidden');
    }

    // === YENİ HARCAMA KAYDETME ===
    if (saveBtn) {
        saveBtn.addEventListener('click', async () => {
            if (!inputAmount.value || inputAmount.value <= 0) return alert("Geçerli bir tutar girin.");
            const originalText = saveBtn.innerHTML; saveBtn.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i>'; saveBtn.disabled = true;

            try {
                const expenseData = {
                    table: inputTable.value, amount: inputAmount.value, currency: inputCurrency.value, category: inputCategory.value, desc: inputDesc.value || "Yok", date: inputDate.value,
                    userId: currentUser.uid, userName: currentUser.displayName || currentUser.email.split('@')[0], groupId: currentGroupId 
                };

                if (editingExpenseId) {
                    expenseData.createdAt = expenses.find(e => e.id === editingExpenseId)?.createdAt || Date.now(); 
                    await updateDoc(doc(db, "harcamalar", editingExpenseId), expenseData);
                } else {
                    expenseData.createdAt = Date.now(); 
                    await addDoc(collection(db, "harcamalar"), expenseData);
                }
                inputAmount.value = ''; inputDesc.value = ''; editingExpenseId = null; expenseModal.classList.add('hidden');
            } catch (error) { alert("Hata oluştu!"); } 
            finally { saveBtn.innerHTML = originalText; saveBtn.disabled = false; }
        });
    }

    // === ARAYÜZ OLAYLARI ===
    if (addCategoryBtn) { addCategoryBtn.addEventListener('click', () => { inputNewCategory.value = ""; newCategoryModal.classList.remove('hidden'); }); }
    if (cancelCategoryBtn) { cancelCategoryBtn.addEventListener('click', () => newCategoryModal.classList.add('hidden')); }
    if (saveCategoryBtn) {
        saveCategoryBtn.addEventListener('click', async () => {
            const newCat = inputNewCategory.value.trim();
            if (newCat && !categories.includes(newCat)) {
                let updatedCategories = [...categories, newCat];
                await setDoc(doc(db, "ayarlar", currentGroupId), { tables, categories: updatedCategories }, { merge: true });
                inputCategory.value = newCat; newCategoryModal.classList.add('hidden'); 
            }
        });
    }
// === YENİ: GERİ BİLDİRİM (BİZE ULAŞIN) SİSTEMİ ===
    const feedbackModal = document.getElementById('feedback-modal');
    const closeFeedbackBtn = document.getElementById('close-feedback-btn');
    const sendFeedbackBtn = document.getElementById('send-feedback-btn');
    const feedbackSubject = document.getElementById('feedback-subject');
    const feedbackMessage = document.getElementById('feedback-message');

    if (openFeedbackBtn) {
        openFeedbackBtn.addEventListener('click', () => {
            if(feedbackMessage) feedbackMessage.value = "";
            feedbackModal.classList.remove('hidden');
        });
    }
    if (closeFeedbackBtn) closeFeedbackBtn.addEventListener('click', () => feedbackModal.classList.add('hidden'));

    if (sendFeedbackBtn) {
        sendFeedbackBtn.addEventListener('click', async () => {
            const msg = feedbackMessage.value.trim();
            if (!msg) return alert("Lütfen bir mesaj yazın.");
            
            const origText = sendFeedbackBtn.innerHTML;
            sendFeedbackBtn.innerHTML = "Gönderiliyor..."; sendFeedbackBtn.disabled = true;
            
            try {
                // Mesajı Firebase'e "geribildirimler" koleksiyonuna kaydediyoruz
                await addDoc(collection(db, "geribildirimler"), {
                    userId: currentUser.uid,
                    userName: currentUser.displayName || "İsimsiz",
                    userEmail: currentUser.email,
                    subject: feedbackSubject.value,
                    message: msg,
                    date: new Date().toISOString()
                });
                alert("Mesajınız başarıyla iletildi! Geri bildiriminiz için teşekkür ederiz.");
                feedbackModal.classList.add('hidden');
            } catch (error) { alert("Bir hata oluştu: " + error.message); } 
            finally { sendFeedbackBtn.innerHTML = origText; sendFeedbackBtn.disabled = false; }
        });
    }



    if (newTableBtn) { newTableBtn.addEventListener('click', () => { inputNewMonth.value = ""; newMonthModal.classList.remove('hidden'); }); }
    if (cancelMonthBtn) { cancelMonthBtn.addEventListener('click', () => newMonthModal.classList.add('hidden')); }
    if (saveMonthBtn) {
        saveMonthBtn.addEventListener('click', async () => {
            const newTable = inputNewMonth.value.trim();
            if (newTable && !tables.includes(newTable)) {
                let updatedTables = [...tables, newTable];
                await setDoc(doc(db, "ayarlar", currentGroupId), { tables: updatedTables, categories }, { merge: true });
                currentTable = newTable; newMonthModal.classList.add('hidden'); 
            }
        });
    }

    if (monthSelect) monthSelect.addEventListener('change', (e) => { currentTable = e.target.value; renderExpenses(); });

    if (tabActive && tabSummary) {
        tabActive.addEventListener('click', () => {
            tabActive.classList.add('active'); tabSummary.classList.remove('active');
            expenseView.classList.remove('hidden'); summaryView.classList.add('hidden');
            document.getElementById('table-selector').style.display = 'flex'; totalDisplay.style.display = 'block';
            renderExpenses(); 
        });
        tabSummary.addEventListener('click', () => {
            tabSummary.classList.add('active'); tabActive.classList.remove('active');
            summaryView.classList.remove('hidden'); expenseView.classList.add('hidden');
            document.getElementById('table-selector').style.display = 'none'; totalDisplay.style.display = 'none';
            renderSummary(); 
        });
    }

    if (fabBtn) {
        fabBtn.addEventListener('click', () => {
            editingExpenseId = null; modalTitle.innerText = "Yeni Harcama"; saveBtn.innerHTML = '<i class="fa-solid fa-check"></i> Kaydet';
            inputTable.value = currentTable; const today = new Date(); inputDate.value = new Date(today.getTime() - (today.getTimezoneOffset() * 60000)).toISOString().split('T')[0];
            inputAmount.value = ""; inputDesc.value = ""; expenseModal.classList.remove('hidden'); 
        });
    }
    if (cancelBtn) cancelBtn.addEventListener('click', () => expenseModal.classList.add('hidden')); 
    
    // YENİ: Filtre Olay Dinleyicileri (Event Listeners)
    if(toggleFilterBtn) {
        toggleFilterBtn.addEventListener('click', () => { filterPanel.classList.toggle('hidden'); });
    }
    if(filterCategory) { filterCategory.addEventListener('change', renderExpenses); }
    if(filterUser) { filterUser.addEventListener('change', renderExpenses); }
    if(clearFilterBtn) { 
        clearFilterBtn.addEventListener('click', () => { 
            filterCategory.value = ""; filterUser.value = ""; renderExpenses(); 
        }); 
    }
});