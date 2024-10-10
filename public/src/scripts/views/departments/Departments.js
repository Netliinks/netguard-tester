// @filename: Departments.ts
import { deleteEntity, getFilterEntityData, registerEntity, getFilterEntityCount } from "../../endpoints.js";
import { inputObserver, inputSelect, CloseDialog, filterDataByHeaderType, pageNumbers, fillBtnPagination, getPermission } from "../../tools.js";
import { Config } from "../../Configs.js";
import { tableLayout } from "./Layout.js";
import { tableLayoutTemplate } from "./Template.js";
const tableRows = Config.tableRows;
const currentPage = Config.currentPage;
const customerId = localStorage.getItem('customer_id');
let infoPage = {
    count: 0,
    offset: Config.offset,
    currentPage: currentPage,
    search: "",
    msgPermission: "",
    actions: []
};
let dataPage;
const getDepartments = async () => {
    const response = async () => {
            //const department = await getEntitiesData('Department');
            //const FCustomer = department.filter((data) => `${data.customer?.id}` === `${customerId}`);
            let raw = JSON.stringify({
            "filter": {
                "conditions": [
                    {
                        "property": "customer.id",
                        "operator": "=",
                        "value": `${customerId}`
                    }
                ],
            },
            sort: "-createdDate",
            limit: Config.tableRows,
            offset: infoPage.offset,
        });
        if (infoPage.search != "") {
            raw = JSON.stringify({
                "filter": {
                    "conditions": [
                        {
                            "group": "OR",
                            "conditions": [
                                {
                                    "property": "name",
                                    "operator": "contains",
                                    "value": `${infoPage.search.toLowerCase()}`
                                }
                            ]
                        },
                        {
                            "property": "customer.id",
                            "operator": "=",
                            "value": `${customerId}`
                        }
                    ]
                },
                sort: "-createdDate",
                limit: Config.tableRows,
                offset: infoPage.offset
            });
        }
        infoPage.count = await getFilterEntityCount("Department", raw);
        dataPage = await getFilterEntityData("Department", raw);
        return dataPage;
    }
    if(Config.currentUser?.isMaster){
        return response();
    }else{
        const permission = await getPermission('DEPARTMENT', Config.currentUser.id);
        if(permission.code === 3){
            infoPage.actions = permission.message.actionsText.split(';');
            if(infoPage.actions.includes("READ")){
                return response();
            }else{
                infoPage.msgPermission = "Usuario no tiene permiso de lectura.";
                infoPage.count = 0;
                return [];
            }
        }else{
            infoPage.msgPermission = permission.message;
            infoPage.count = 0;
            return [];
        }
        
    }
};
export class Departments {
    constructor() {
        this.dialogContainer = document.getElementById('app-dialogs');
        this.entityDialogContainer = document.getElementById('entity-editor-container');
        this.content = document.getElementById('datatable-container');
        this.searchEntity = async (tableBody /*, data: any*/) => {
            const search = document.getElementById('search');
            const btnSearch = document.getElementById('btnSearch');
            search.value = infoPage.search;
            await search.addEventListener('keyup', () => {
                /*const arrayData = data.filter((user) => `${user.name}`
                    .toLowerCase()
                    .includes(search.value.toLowerCase()));
                let filteredResult = arrayData.length;
                let result = arrayData;
                if (filteredResult >= tableRows)
                    filteredResult = tableRows;
                this.load(tableBody, currentPage, result);
                this.pagination(result, tableRows, currentPage);*/
            });
            btnSearch.addEventListener('click', async () => {
                new Departments().render(Config.offset, Config.currentPage, search.value.toLowerCase().trim());
            });
        };
    }
    
    async render(offset, actualPage, search) {
        infoPage.offset = offset;
        infoPage.currentPage = actualPage;
        infoPage.search = search;
        this.content.innerHTML = '';
        this.content.innerHTML = tableLayout;
        const tableBody = document.getElementById('datatable-body');
        tableBody.innerHTML = '.Cargando...';
        let data = await getDepartments();
        tableBody.innerHTML = tableLayoutTemplate.repeat(tableRows);
        this.load(tableBody, currentPage, data);
        this.searchEntity(tableBody /*, data*/);
        new filterDataByHeaderType().filter();
        this.pagination(data, tableRows, infoPage.currentPage);
    }

    load(table, currentPage, data) {
        table.innerHTML = '';
        currentPage--;
        let start = tableRows * currentPage;
        let end = start + tableRows;
        let paginatedItems = data.slice(start, end);
        if (data.length === 0) {
            let mensaje = `No existen datos. ${infoPage.msgPermission}`;
            if(customerId == null){mensaje = 'Seleccione una empresa';}
            let row = document.createElement('tr');
            row.innerHTML = `
        <td>${mensaje}</td>
        <td></td>
        <td></td>
      `;
            table.appendChild(row);
        }
        else {
            for (let i = 0; i < paginatedItems.length; i++) {
                let department = paginatedItems[i];
                let row = document.createElement('tr');
                row.innerHTML += `
          <td>${department.name}</dt>
          <td class="entity_options">
            <button class="button" id="remove-entity" data-entityId="${department.id}">
              <i class="fa-solid fa-trash"></i>
            </button>
          </dt>
        `;
                table.appendChild(row);
            }
        }
        this.register();
        this.remove();
    }
    pagination(items, limitRows, currentPage) {
      const tableBody = document.getElementById('datatable-body');
      const paginationWrapper = document.getElementById('pagination-container');
      paginationWrapper.innerHTML = '';
      let pageCount;
      pageCount = Math.ceil(infoPage.count / limitRows);
      let button;
      if (pageCount <= Config.maxLimitPage) {
          for (let i = 1; i < pageCount + 1; i++) {
              button = setupButtons(i /*, items, currentPage, tableBody, limitRows*/);
              paginationWrapper.appendChild(button);
          }
          fillBtnPagination(currentPage, Config.colorPagination);
      }
      else {
          pagesOptions(items, currentPage);
      }
      function setupButtons(page /*, items, currentPage, tableBody, limitRows*/) {
          const button = document.createElement('button');
          button.classList.add('pagination_button');
          button.setAttribute("name", "pagination-button");
            button.setAttribute("id", "btnPag" + page);
            button.innerText = page;
            button.addEventListener('click', () => {
                infoPage.offset = Config.tableRows * (page - 1);
                currentPage = page;
                new Departments().render(infoPage.offset, currentPage, infoPage.search);
            });
            return button;
        }
        function pagesOptions(items, currentPage) {
            paginationWrapper.innerHTML = '';
            let pages = pageNumbers(infoPage.count, Config.maxLimitPage, currentPage);
            const prevButton = document.createElement('button');
            prevButton.classList.add('pagination_button');
            prevButton.innerText = "<<";
            paginationWrapper.appendChild(prevButton);
            const nextButton = document.createElement('button');
            nextButton.classList.add('pagination_button');
            nextButton.innerText = ">>";
            for (let i = 0; i < pages.length; i++) {
                if (pages[i] > 0 && pages[i] <= pageCount) {
                    button = setupButtons(pages[i]);
                    paginationWrapper.appendChild(button);
                }
            }
            paginationWrapper.appendChild(nextButton);
            fillBtnPagination(currentPage, Config.colorPagination);
            setupButtonsEvents(prevButton, nextButton);
        }
        function setupButtonsEvents(prevButton, nextButton) {
            prevButton.addEventListener('click', () => {
                new Departments().render(Config.offset, Config.currentPage, infoPage.search);
            });
            nextButton.addEventListener('click', () => {
                infoPage.offset = Config.tableRows * (pageCount - 1);
                new Departments().render(infoPage.offset, pageCount, infoPage.search);
            });
        }
    }
    register() {
        // register entity
        const openEditor = document.getElementById('new-entity');
        openEditor.addEventListener('click', () => {
            if(infoPage.actions.includes("INS") || Config.currentUser?.isMaster){
                renderInterface();
            }else{
                alert("Usuario no tiene permiso de registrar.");
            }
        });
        const renderInterface = async () => {
            this.entityDialogContainer.innerHTML = '';
            this.entityDialogContainer.style.display = 'flex';
            this.entityDialogContainer.innerHTML = `
        <div class="entity_editor" id="entity-editor">
          <div class="entity_editor_header">
            <div class="user_info">
              <div class="avatar"><i class="fa-solid fa-building"></i></div>
              <h1 class="entity_editor_title">Registrar <br><small>Departamento</small></h1>
            </div>

            <button class="btn btn_close_editor" id="close"><i class="fa-regular fa-x"></i></button>
          </div>

          <!-- EDITOR BODY -->
          <div class="entity_editor_body">
            <div class="material_input">
              <input type="text" id="entity-name" autocomplete="none">
              <label for="entity-name">Nombre</label>
            </div>

            <!--
            <div class="material_input_select">
              <label for="entity-customer">Cliente</label>
              <input type="text" id="entity-customer" class="input_select" readonly placeholder="cargando...">
              <div id="input-options" class="input_options">
              </div>
            </div>
            -->
          </div>
          <!-- END EDITOR BODY -->

          <div class="entity_editor_footer">
            <button class="btn btn_primary btn_widder" id="register-entity">Guardar</button>
          </div>
        </div>
      `;
            // @ts-ignore
            inputObserver();
            //inputSelect('Customer', 'entity-customer');
            this.close();
            const registerButton = document.getElementById('register-entity');
            registerButton.addEventListener('click', () => {
                if(!infoPage.actions.includes("INS") && !Config.currentUser?.isMaster){
                    alert("Usuario no tiene permiso de registrar.");
                }else{
                    const inputsCollection = {
                        name: document.getElementById('entity-name'),
                        //customer: document.getElementById('entity-customer'),
                    };
                    const raw = JSON.stringify({
                        "name": `${inputsCollection.name.value}`,
                        "customer": {
                            "id": `${customerId}`
                        }
                    });
                    registerEntity(raw, 'Department');
                    setTimeout(() => {
                        const container = document.getElementById('entity-editor-container');
                        new CloseDialog().x(container);
                        new Departments().render(Config.offset, Config.currentPage, infoPage.search);
                    }, 1000);
                }
            });
        };
        const reg = async (raw) => {
        };
    }
    remove() {
        const remove = document.querySelectorAll('#remove-entity');
        remove.forEach((remove) => {
            const entityId = remove.dataset.entityid;
            remove.addEventListener('click', () => {
                if(!infoPage.actions.includes("DLT") && !Config.currentUser?.isMaster){
                    alert("Usuario no tiene permiso de eliminar.");
                }else{
                this.dialogContainer.style.display = 'flex';
                    this.dialogContainer.innerHTML = `
            <div class="dialog_content" id="dialog-content">
                <div class="dialog dialog_danger">
                <div class="dialog_container">
                    <div class="dialog_header">
                    <h2>¿Deseas eliminar este departamento?</h2>
                    </div>

                    <div class="dialog_message">
                    <p>Esta acción no se puede revertir</p>
                    </div>

                    <div class="dialog_footer">
                    <button class="btn btn_primary" id="cancel">Cancelar</button>
                    <button class="btn btn_danger" id="delete">Eliminar</button>
                    </div>
                </div>
                </div>
            </div>
            `;
                    // delete button
                    // cancel button
                    // dialog content
                    const deleteButton = document.getElementById('delete');
                    const cancelButton = document.getElementById('cancel');
                    const dialogContent = document.getElementById('dialog-content');
                    deleteButton.onclick = () => {
                        if(!infoPage.actions.includes("DLT") && !Config.currentUser?.isMaster){
                            alert("Usuario no tiene permiso de eliminar.");
                        }else{
                            deleteEntity('Department', entityId)
                                .then(res => new Departments().render(infoPage.offset, infoPage.currentPage, infoPage.search));
                            new CloseDialog().x(dialogContent);
                        }
                    };
                    cancelButton.onclick = () => {
                        new CloseDialog().x(dialogContent);
                    };
                }
            });
        });
    }
    close() {
        const closeButton = document.getElementById('close');
        const editor = document.getElementById('entity-editor-container');
        closeButton.addEventListener('click', () => {
            //console.log('close');
            new CloseDialog().x(editor);
        });
    }
}
