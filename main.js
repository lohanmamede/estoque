document.addEventListener("DOMContentLoaded", () => {
    const productTable = document.getElementById("product-table");
    const addProductBtn = document.getElementById("add-product-btn");
    const searchBar = document.getElementById("search-bar");

    const dbName = "MinimalProductDB";

    // Abrir ou criar o banco de dados IndexedDB
    const openDB = () => {
        return new Promise((resolve, reject) => {
            const request = indexedDB.open(dbName, 1);

            request.onupgradeneeded = (event) => {
                const db = event.target.result;
                if (!db.objectStoreNames.contains("products")) {
                    db.createObjectStore("products", { keyPath: "id", autoIncrement: true });
                }
            };

            request.onsuccess = () => resolve(request.result);
            request.onerror = () => reject(request.error);
        });
    };

    // Adicionar produto no IndexedDB
    const addProductToDB = async (product) => {
        const db = await openDB();
        const tx = db.transaction("products", "readwrite");
        const store = tx.objectStore("products");
        store.add(product);
        tx.oncomplete = () => loadProducts();
    };

    // Carregar produtos do IndexedDB
    const loadProducts = async () => {
        const db = await openDB();
        const tx = db.transaction("products", "readonly");
        const store = tx.objectStore("products");
        const products = [];

        store.openCursor().onsuccess = (event) => {
            const cursor = event.target.result;
            if (cursor) {
                products.push(cursor.value);
                cursor.continue();
            } else {
                renderProducts(products);
            }
        };
    };

    // Renderizar produtos na tabela
    const renderProducts = (products) => {
        productTable.innerHTML = "";

        products.forEach((product) => {
            const row = document.createElement("tr");
            row.innerHTML = `
                <td>${product.description}</td>
                <td>${product.brand || "Sem marca"}</td>
                <td>${product.quantity || 1}</td>
                <td>
                    <button class="btn-danger" data-id="${product.id}">Excluir</button>
                </td>
            `;
            productTable.appendChild(row);
        });
    };

    // Excluir produto do IndexedDB
    const deleteProductFromDB = async (id) => {
        const db = await openDB();
        const tx = db.transaction("products", "readwrite");
        const store = tx.objectStore("products");
        store.delete(id);
        tx.oncomplete = () => loadProducts();
    };

    // Adicionar produto
    addProductBtn.addEventListener("click", () => {
        const description = prompt("Digite a descrição do produto:");
        if (!description) {
            alert("Descrição é obrigatória!");
            return;
        }

        const brand = prompt("Digite a marca do produto (opcional):");
        const quantity = parseInt(prompt("Digite a quantidade (opcional):"), 10) || 1;

        const newProduct = { description, brand, quantity };
        addProductToDB(newProduct);
    });

    // Buscar produtos
    searchBar.addEventListener("input", async () => {
        const query = searchBar.value.toLowerCase();
        const db = await openDB();
        const tx = db.transaction("products", "readonly");
        const store = tx.objectStore("products");
        const products = [];

        store.openCursor().onsuccess = (event) => {
            const cursor = event.target.result;
            if (cursor) {
                const product = cursor.value;
                if (product.description.toLowerCase().includes(query)) {
                    products.push(product);
                }
                cursor.continue();
            } else {
                renderProducts(products);
            }
        };
    });

    // Excluir produto
    productTable.addEventListener("click", (event) => {
        if (event.target.classList.contains("btn-danger")) {
            const id = Number(event.target.getAttribute("data-id"));
            deleteProductFromDB(id);
        }
    });

    // Carregar produtos ao iniciar
    loadProducts();

    // Adicionar funcionalidade de redimensionamento às colunas
    const makeTableResizable = () => {
        const table = document.querySelector(".resizable-table");
        const cols = table.querySelectorAll("th");
        let isResizing = false;
        let startX;
        let currentCol;
        let nextCol;
        let currentColWidth;
        let nextColWidth;

        cols.forEach((col) => {
            const resizer = col.querySelector(".resizer");
            resizer.addEventListener("mousedown", (e) => {
                isResizing = true;
                startX = e.pageX;

                currentCol = col;
                nextCol = col.nextElementSibling;

                currentColWidth = currentCol.offsetWidth;
                if (nextCol) {
                    nextColWidth = nextCol.offsetWidth;
                }

                document.addEventListener("mousemove", onMouseMove);
                document.addEventListener("mouseup", onMouseUp);
            });
        });

        function onMouseMove(e) {
            if (!isResizing) return;

            const diffX = e.pageX - startX;

            if (nextCol) {
                currentCol.style.width = `${currentColWidth + diffX}px`;
                nextCol.style.width = `${nextColWidth - diffX}px`;
            } else {
                currentCol.style.width = `${currentColWidth + diffX}px`;
            }
        }

        function onMouseUp() {
            isResizing = false;
            document.removeEventListener("mousemove", onMouseMove);
            document.removeEventListener("mouseup", onMouseUp);
        }
    };

    makeTableResizable();
});