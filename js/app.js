// === PWA (MOBİL UYGULAMA) SERVICE WORKER KAYDI ===
if ('serviceWorker' in navigator) {
    window.addEventListener('load', () => {
        navigator.serviceWorker.register('./sw.js').then(reg => {
            console.log('Service Worker başarıyla kaydedildi.');
        }).catch(err => {
            console.log('Service Worker hatası:', err);
        });
    });
}

// === FİREBASE MODÜLLERİ ===
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.11.0/firebase-app.js";
import { getFirestore, collection, addDoc, getDocs, doc, getDoc, setDoc, deleteDoc, updateDoc, query, where } from "https://www.gstatic.com/firebasejs/10.11.0/firebase-firestore.js";
import { getAuth, createUserWithEmailAndPassword, signInWithEmailAndPassword, onAuthStateChanged, signOut, updateProfile } from "https://www.gstatic.com/firebasejs/10.11.0/firebase-auth.js";

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

document.addEventListener('DOMContentLoaded', () => {
    
    let tables = [];
    let currentTable = ""; 
    let expenses = [];
    let categories = [];
    let editingExpenseId = null; 
    let expenseChartInstance = null;
    let currentUser = null; 
    let currentGroupId = null; 

    let deleteTargetType = ""; 
    let deleteTargetId = "";   
    let tableToEditOldName = "";

    // HTML Elemanları
    const authContainer = document.getElementById('auth-container');
    const appContainer = document.getElementById('app-container');
    const authEmail = document.getElementById('auth-email');
    const authPassword = document.getElementById('auth-password');
    const loginBtn = document.getElementById('login-btn');
    const openRegisterModalBtn = document.getElementById('open-register-modal-btn');
    const logoutBtn = document.getElementById('logout-btn');
    const userEmailDisplay = document.getElementById('user-email-display');

    const registerModal = document.getElementById('register-modal');
    const regName = document.getElementById('reg-name');
    const regSurname = document.getElementById('reg-surname');
    const regEmail = document.getElementById('reg-email');
    const regPassword = document.getElementById('reg-password');
    const regTerms = document.getElementById('reg-terms'); // YENİ: KVKK Onay Kutusu
    const registerSubmitBtn = document.getElementById('register-submit-btn');
    const registerCancelBtn = document.getElementById('register-cancel-btn');

    const openGroupModalBtn = document.getElementById('open-group-modal-btn');
    const groupModal = document.getElementById('group-modal');
    const closeGroupModalBtn = document.getElementById('close-group-modal-btn');
    const myGroupCodeDisplay = document.getElementById('my-group-code');
    const joinGroupInput = document.getElementById('join-group-input');
    const joinGroupBtn = document.getElementById('join-group-btn');
    const leaveGroupBtn = document.getElementById('leave-group-btn');

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
        if(lowerCat.includes("benzin") || lowerCat.includes("yakıt") || lowerCat.includes("araba")) return "fa-gas-pump";
        if(lowerCat.includes("kumanya") || lowerCat.includes("market")) return "fa-cart-shopping";
        if(lowerCat.includes("yemek") || lowerCat.includes("restoran")) return "fa-utensils";
        if(lowerCat.includes("fatura") || lowerCat.includes("elektrik") || lowerCat.includes("su")) return "fa-file-invoice-dollar";
        if(lowerCat.includes("giyim") || lowerCat.includes("kıyafet")) return "fa-shirt";
        return "fa-tag"; 
    }

    // === KİMLİK DOĞRULAMA & GRUP MİMARİSİ ===

    function translateAuthError(errorCode) {
        switch (errorCode) {
            case 'auth/email-already-in-use': return "Bu e-posta adresi zaten kullanımda.";
            case 'auth/invalid-email': return "Geçersiz bir e-posta formatı girdiniz.";
            case 'auth/weak-password': return "Şifreniz çok zayıf. En az 6 karakter belirleyin.";
            case 'auth/user-not-found': return "Bu e-postaya ait hesap bulunamadı.";
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
            const displayName = user.displayName ? user.displayName : user.email;
            userEmailDisplay.innerHTML = `<i class="fa-solid fa-user"></i> ${displayName}`;

            const userRef = doc(db, "kullanicilar", user.uid);
            const userSnap = await getDoc(userRef);
            
            if(userSnap.exists()) {
                currentGroupId = userSnap.data().groupId;
            } else {
                await setDoc(userRef, { email: user.email, groupId: user.uid });
                currentGroupId = user.uid;
            }
            
            myGroupCodeDisplay.innerText = currentGroupId;
            fetchInitialData(); 
        } else {
            currentUser = null; currentGroupId = null;
            appContainer.classList.add('hidden');
            authContainer.classList.remove('hidden');
            expenses = []; tables = []; categories = []; 
        }
    });

    openGroupModalBtn.addEventListener('click', () => groupModal.classList.remove('hidden'));
    closeGroupModalBtn.addEventListener('click', () => groupModal.classList.add('hidden'));

    joinGroupBtn.addEventListener('click', async () => {
        const code = joinGroupInput.value.trim();
        if(!code) return alert("Lütfen bir grup kodu girin.");
        if(code === currentGroupId) return alert("Zaten bu gruptasınız.");
        
        try {
            await updateDoc(doc(db, "kullanicilar", currentUser.uid), { groupId: code });
            currentGroupId = code;
            myGroupCodeDisplay.innerText = currentGroupId;
            alert("Gruba başarıyla katıldınız! Verileriniz senkronize ediliyor...");
            groupModal.classList.add('hidden');
            fetchInitialData(); 
        } catch (error) {
            alert("Gruba katılamadık. Kod hatalı olabilir.");
        }
    });

    leaveGroupBtn.addEventListener('click', async () => {
        if(!confirm("Kendi şahsi çalışma alanınıza dönmek istediğinize emin misiniz?")) return;
        try {
            await updateDoc(doc(db, "kullanicilar", currentUser.uid), { groupId: currentUser.uid });
            currentGroupId = currentUser.uid;
            myGroupCodeDisplay.innerText = currentGroupId;
            alert("Kendi bütçenize döndünüz.");
            groupModal.classList.add('hidden');
            fetchInitialData();
        } catch (error) { alert("Hata oluştu."); }
    });

    openRegisterModalBtn.addEventListener('click', () => {
        regName.value = ""; regSurname.value = ""; regEmail.value = ""; regPassword.value = "";
        regTerms.checked = false; // YENİ: Checkbox temizlendi
        registerModal.classList.remove('hidden');
    });
    registerCancelBtn.addEventListener('click', () => registerModal.classList.add('hidden'));

    registerSubmitBtn.addEventListener('click', async () => {
        const name = regName.value.trim(); const surname = regSurname.value.trim();
        const email = regEmail.value.trim(); const password = regPassword.value;
        
        // YENİ: Yasal metin onayı kontrol ediliyor
        if(!regTerms.checked) return alert("Kayıt olmak için Kullanım Koşulları ve Gizlilik Politikasını kabul etmelisiniz.");
        
        if(!name || !surname || !email || !password) return alert("Lütfen tüm alanları doldurun.");
        if(password.length < 6) return alert("Şifre en az 6 karakter olmalıdır.");

        const originalText = registerSubmitBtn.innerHTML;
        registerSubmitBtn.innerHTML = "Kaydediliyor..."; registerSubmitBtn.disabled = true;
        try {
            const userCredential = await createUserWithEmailAndPassword(auth, email, password);
            await updateProfile(userCredential.user, { displayName: `${name} ${surname}` });
            registerModal.classList.add('hidden');
        } catch (error) { alert(translateAuthError(error.code)); } 
        finally { registerSubmitBtn.innerHTML = originalText; registerSubmitBtn.disabled = false; }
    });

    loginBtn.addEventListener('click', async () => {
        const email = authEmail.value; const password = authPassword.value;
        if(!email || !password) return alert("Lütfen e-posta ve şifre alanlarını doldurun.");
        try { await signInWithEmailAndPassword(auth, email, password); } 
        catch (error) { alert(translateAuthError(error.code)); }
    });

    logoutBtn.addEventListener('click', async () => await signOut(auth));

    // === VERİ ÇEKME ===

    async function fetchInitialData() {
        if(!currentGroupId) return;
        try {
            const settingsRef = doc(db, "ayarlar", currentGroupId);
            const settingsSnap = await getDoc(settingsRef);

            if (settingsSnap.exists()) {
                tables = settingsSnap.data().tables || ["Genel Bütçe"];
                categories = settingsSnap.data().categories || ["Market", "Fatura", "Benzin"];
            } else {
                tables = ["Genel Bütçe"];
                categories = ["Market", "Fatura", "Benzin"];
                await setDoc(settingsRef, { tables, categories });
            }
            currentTable = tables[0];

            const q = query(collection(db, "harcamalar"), where("groupId", "==", currentGroupId));
            const querySnapshot = await getDocs(q);
            expenses = []; 
            querySnapshot.forEach((doc) => { expenses.push({ id: doc.id, ...doc.data() }); });

            renderTables(); renderCategories(); renderExpenses();
            if(!summaryView.classList.contains('hidden')) renderSummary();
        } catch (error) { console.error("Veri çekme hatası:", error); }
    }

    // === SİLME VE DÜZENLEME MANTIĞI ===

    function requestDeleteExpense(expenseId) {
        deleteTargetType = "expense"; deleteTargetId = expenseId;
        confirmMessage.innerText = "Bu harcamayı silmek istediğinize emin misiniz?";
        confirmModal.classList.remove('hidden');
    }

    function requestDeleteTable(tableName) {
        deleteTargetType = "table"; deleteTargetId = tableName;
        confirmMessage.innerText = `DİKKAT: "${tableName}" tablosunu ve içindeki TÜM harcamaları kalıcı olarak silmek üzeresiniz. Emin misiniz?`;
        confirmModal.classList.remove('hidden');
    }

    confirmNoBtn.addEventListener('click', () => {
        confirmModal.classList.add('hidden');
        deleteTargetType = ""; deleteTargetId = "";
    });

    confirmYesBtn.addEventListener('click', async () => {
        const originalText = confirmYesBtn.innerHTML;
        confirmYesBtn.innerHTML = "Siliniyor..."; confirmYesBtn.disabled = true;

        try {
            if (deleteTargetType === "expense") {
                await deleteDoc(doc(db, "harcamalar", deleteTargetId));
                expenses = expenses.filter(exp => exp.id !== deleteTargetId);
            } 
            else if (deleteTargetType === "table") {
                tables = tables.filter(t => t !== deleteTargetId);
                if (tables.length === 0) tables = ["Genel Bütçe"];
                if (currentTable === deleteTargetId) currentTable = tables[0];
                await setDoc(doc(db, "ayarlar", currentGroupId), { tables, categories }, { merge: true });

                const expensesToDelete = expenses.filter(e => e.table === deleteTargetId);
                for (const exp of expensesToDelete) { await deleteDoc(doc(db, "harcamalar", exp.id)); }
                expenses = expenses.filter(e => e.table !== deleteTargetId);
            }
            
            renderTables(); renderExpenses();
            if (!summaryView.classList.contains('hidden')) renderSummary();
            confirmModal.classList.add('hidden');
        } catch (error) { alert("Silme işlemi başarısız oldu!"); } 
        finally { confirmYesBtn.innerHTML = originalText; confirmYesBtn.disabled = false; }
    });

    function openEditTableModal(oldName) {
        tableToEditOldName = oldName;
        inputEditTableName.value = oldName;
        editTableModal.classList.remove('hidden');
    }

    cancelEditTableBtn.addEventListener('click', () => editTableModal.classList.add('hidden'));

    saveEditTableBtn.addEventListener('click', async () => {
        const newName = inputEditTableName.value.trim();
        if (!newName || newName === tableToEditOldName) return editTableModal.classList.add('hidden');
        if (tables.includes(newName)) return alert("Bu isimde bir tablo zaten var!");

        const originalText = saveEditTableBtn.innerHTML;
        saveEditTableBtn.innerHTML = "Güncelleniyor..."; saveEditTableBtn.disabled = true;

        try {
            const index = tables.indexOf(tableToEditOldName);
            if (index !== -1) tables[index] = newName;
            if (currentTable === tableToEditOldName) currentTable = newName;
            await setDoc(doc(db, "ayarlar", currentGroupId), { tables, categories }, { merge: true });

            const expensesToUpdate = expenses.filter(e => e.table === tableToEditOldName);
            for (const exp of expensesToUpdate) {
                await updateDoc(doc(db, "harcamalar", exp.id), { table: newName });
                exp.table = newName; 
            }

            renderTables(); renderExpenses();
            if (!summaryView.classList.contains('hidden')) renderSummary();
            editTableModal.classList.add('hidden');
        } catch (error) { alert("Tablo adı güncellenemedi!"); } 
        finally { saveEditTableBtn.innerHTML = originalText; saveEditTableBtn.disabled = false; }
    });

    // === EKRAN ÇİZİM VE GRAFİK ===

    function renderChart(currentExpenses) {
        if (!chartContainer) return;
        if(currentExpenses.length === 0) { chartContainer.classList.add('hidden'); return; } 
        else { chartContainer.classList.remove('hidden'); }

        const categoryTotals = {};
        currentExpenses.forEach(exp => {
            const cat = exp.category || "Belirtilmedi";
            categoryTotals[cat] = (categoryTotals[cat] || 0) + Number(exp.amount || 0);
        });

        if (expenseChartInstance) expenseChartInstance.destroy();

        const ctx = document.getElementById('expenseChart').getContext('2d');
        expenseChartInstance = new Chart(ctx, {
            type: 'doughnut', 
            data: {
                labels: Object.keys(categoryTotals),
                datasets: [{
                    data: Object.values(categoryTotals),
                    backgroundColor: ['#ff6b6b', '#339af0', '#51cf66', '#fcc419', '#845ef7', '#ff922b', '#20c997'],
                    borderWidth: 2, borderColor: 'var(--surface-color)'
                }]
            },
            options: { responsive: true, maintainAspectRatio: false, plugins: { legend: { position: 'right' } } }
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
            const option = document.createElement('option');
            option.value = cat; option.innerText = cat;
            inputCategory.appendChild(option);
        });
    }

    expenseList.addEventListener('click', (e) => {
        const editBtn = e.target.closest('.edit-btn');
        if (editBtn) {
            editExpenseData(editBtn.getAttribute('data-id'));
        }
        
        const deleteBtn = e.target.closest('.delete-btn');
        if (deleteBtn) {
            requestDeleteExpense(deleteBtn.getAttribute('data-id'));
        }
    });

    function renderExpenses() {
        if (!expenseList) return;
        expenseList.innerHTML = ''; 
        
        const currentExpenses = expenses
            .filter(exp => exp.table === currentTable)
            .sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0));

        let totalAmount = 0;

        currentExpenses.forEach(exp => {
            totalAmount += Number(exp.amount || 0);
            const expenseItem = document.createElement('div');
            expenseItem.className = 'expense-item'; 
            const iconClass = getCategoryIcon(exp.category || "");
            const addedByName = exp.userName || (exp.userEmail ? exp.userEmail.split('@')[0] : "Bilinmiyor");
            
            expenseItem.innerHTML = `
                <div style="flex: 1; display: flex; align-items: center;">
                    <i class="fa-solid ${iconClass} cat-icon"></i>
                    <div>
                        <strong style="display:block; font-size: 1.1em; margin-bottom: 2px;">${exp.desc || "Açıklama Yok"}</strong>
                        <small style="color: #666; font-size: 0.85em;">${exp.category || "Belirtilmedi"} | ${exp.date} <span style="opacity:0.6; margin-left:5px;"><i class="fa-solid fa-user-pen"></i> ${addedByName}</span></small>
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
            
            const card = document.createElement('div');
            card.className = 'summary-card';
            card.innerHTML = `
                <div class="summary-info clickable-table" data-table="${table}" style="flex: 1; cursor: pointer;" title="Detayları Görmek İçin Tıkla">
                    <div class="summary-month"><i class="fa-solid fa-table cat-icon"></i> ${table}</div>
                    <div class="summary-total">${monthTotal} ₺</div>
                </div>
                <div class="action-buttons" style="margin-left: 15px;">
                    <button class="icon-btn edit-btn edit-table-btn" data-table="${table}" title="Tablo Adını Değiştir"><i class="fa-solid fa-pen"></i></button>
                    <button class="icon-btn delete-btn delete-table-btn" data-table="${table}" title="Tüm Tabloyu Sil"><i class="fa-solid fa-trash"></i></button>
                </div>
            `;
            summaryList.appendChild(card);
        });

        document.querySelectorAll('.clickable-table').forEach(item => {
            item.addEventListener('click', (e) => {
                const selectedTable = e.currentTarget.getAttribute('data-table');
                currentTable = selectedTable; 
                renderTables(); renderExpenses(); tabActive.click(); 
            });
        });

        document.querySelectorAll('.delete-table-btn').forEach(btn => btn.addEventListener('click', (e) => requestDeleteTable(e.currentTarget.getAttribute('data-table'))));
        document.querySelectorAll('.edit-table-btn').forEach(btn => btn.addEventListener('click', (e) => openEditTableModal(e.currentTarget.getAttribute('data-table'))));
    }

    function editExpenseData(expenseId) {
        const exp = expenses.find(e => e.id === expenseId);
        if(!exp) return;

        inputTable.value = exp.table; inputAmount.value = exp.amount;
        inputCurrency.value = exp.currency; inputCategory.value = exp.category;
        inputDesc.value = exp.desc; inputDate.value = exp.date;

        editingExpenseId = expenseId;
        modalTitle.innerText = "Harcama Düzenle";
        saveBtn.innerHTML = '<i class="fa-solid fa-floppy-disk"></i> Güncelle';
        expenseModal.classList.remove('hidden');
    }

    // === YENİ HARCAMA KAYDETME ===

    if (saveBtn) {
        saveBtn.addEventListener('click', async () => {
            if (!inputAmount.value || inputAmount.value <= 0) return alert("Lütfen geçerli bir tutar girin.");

            const originalText = saveBtn.innerHTML;
            saveBtn.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> Kaydediliyor...';
            saveBtn.disabled = true;

            try {
                const expenseData = {
                    table: inputTable.value, amount: inputAmount.value,
                    currency: inputCurrency.value, category: inputCategory.value,
                    desc: inputDesc.value || "Açıklama Yok", date: inputDate.value,
                    userId: currentUser.uid, 
                    userEmail: currentUser.email,
                    userName: currentUser.displayName || currentUser.email,
                    groupId: currentGroupId 
                };

                if (editingExpenseId) {
                    const existingExp = expenses.find(e => e.id === editingExpenseId);
                    expenseData.createdAt = existingExp.createdAt || Date.now(); 
                    
                    await updateDoc(doc(db, "harcamalar", editingExpenseId), expenseData);
                    const index = expenses.findIndex(e => e.id === editingExpenseId);
                    if(index !== -1) expenses[index] = { id: editingExpenseId, ...expenseData };
                } else {
                    expenseData.createdAt = Date.now(); 
                    const docRef = await addDoc(collection(db, "harcamalar"), expenseData);
                    expenses.push({ id: docRef.id, ...expenseData });
                }

                renderExpenses();
                if(!summaryView.classList.contains('hidden')) renderSummary(); 

                inputAmount.value = ''; inputDesc.value = '';
                editingExpenseId = null; 
                expenseModal.classList.add('hidden');
            } catch (error) { alert("İşlem başarısız!"); } 
            finally { saveBtn.innerHTML = originalText; saveBtn.disabled = false; }
        });
    }

    // === ARAYÜZ OLAYLARI ===

    if (addCategoryBtn) { addCategoryBtn.addEventListener('click', () => { inputNewCategory.value = ""; newCategoryModal.classList.remove('hidden'); }); }
    if (cancelCategoryBtn) { cancelCategoryBtn.addEventListener('click', () => newCategoryModal.classList.add('hidden')); }
    if (saveCategoryBtn) {
        saveCategoryBtn.addEventListener('click', async () => {
            const newCat = inputNewCategory.value;
            if (newCat && newCat.trim() !== "" && !categories.includes(newCat.trim())) {
                const formattedCat = newCat.trim(); categories.push(formattedCat); 
                await setDoc(doc(db, "ayarlar", currentGroupId), { tables, categories }, { merge: true });
                renderCategories(); inputCategory.value = formattedCat; newCategoryModal.classList.add('hidden'); 
            }
        });
    }

    if (newTableBtn) { newTableBtn.addEventListener('click', () => { inputNewMonth.value = ""; newMonthModal.classList.remove('hidden'); }); }
    if (cancelMonthBtn) { cancelMonthBtn.addEventListener('click', () => newMonthModal.classList.add('hidden')); }
    if (saveMonthBtn) {
        saveMonthBtn.addEventListener('click', async () => {
            const newTable = inputNewMonth.value;
            if (newTable && newTable.trim() !== "" && !tables.includes(newTable.trim())) {
                tables.push(newTable.trim()); currentTable = newTable.trim(); 
                await setDoc(doc(db, "ayarlar", currentGroupId), { tables, categories }, { merge: true });
                renderTables(); renderExpenses(); newMonthModal.classList.add('hidden'); 
            }
        });
    }

    if (monthSelect) { monthSelect.addEventListener('change', (e) => { currentTable = e.target.value; renderExpenses(); }); }

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
            editingExpenseId = null;
            modalTitle.innerText = "Yeni Harcama";
            saveBtn.innerHTML = '<i class="fa-solid fa-check"></i> Kaydet';
            inputTable.value = currentTable; 
            const today = new Date();
            inputDate.value = new Date(today.getTime() - (today.getTimezoneOffset() * 60000)).toISOString().split('T')[0];
            inputAmount.value = ""; inputDesc.value = "";
            expenseModal.classList.remove('hidden'); 
        });
    }
    
    if (cancelBtn) { cancelBtn.addEventListener('click', () => expenseModal.classList.add('hidden')); }

});