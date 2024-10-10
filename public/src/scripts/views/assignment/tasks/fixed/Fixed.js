// @filename: Fixed.ts
import { deleteEntity, getEntitiesData, getFilterEntityCount, registerEntity, updateEntity, getEntityData, setFile, getUserInfo, getFile, postNotificationPush, getFilterEntityData } from "../../../../endpoints.js";
import { inputObserver, inputSelect, CloseDialog, filterDataByHeaderType, fillBtnPagination, searchUniversalSingle, currentDateTime, getPermission } from "../../../../tools.js";
import { Config } from "../../../../Configs.js";
import { tableLayout } from "./Layout.js";
import { tableLayoutTemplate } from "./Template.js";
import { exportFixedCsv, exportFixedPdf, exportFixedXls } from "../../../../exportFiles/taskFixed.js";

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
const currentBusiness = async() => {
    //const currentUser = await getUserInfo();
    //const userid = await getEntityData('User', `${currentUser.attributes.id}`);
    return Config.currentUser;
  }
let dataPage;
let currentUser;
const getTakFixed = async () => {
    //nombre de la entidad
    //const takFixed = await getEntitiesData('Task_');
    //console.log(takFixed)
    //const FCustomer = takFixed.filter((data) => `${data.customer?.id}` === `${customerId}` && `${data.taskType}`==='FIJAS'  &&  `${data.user.userType}`==='GUARD');
    //return FCustomer;

    //const notesRaw = await getEntitiesData('Note');
    //const notes = notesRaw.filter((data) => data.customer?.id === `${customerId}`);
    currentUser = await currentBusiness();
    const response = async () => {
        let raw = JSON.stringify({
            "filter": {
                "conditions": [
                    {
                        "property": "customer.id",
                        "operator": "=",
                        "value": `${customerId}`
                    },
                    {
                        "property": "taskType",
                        "operator": "=",
                        "value": `FIJAS`
                    },
                    {
                        "property": "user.userType",
                        "operator": "=",
                        "value": `GUARD`
                    }
                ],
            },
            sort: "+execTime",
            limit: Config.tableRows,
            offset: infoPage.offset,
            fetchPlan: 'full',
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
                        },
                        {
                            "property": "taskType",
                            "operator": "=",
                            "value": `FIJAS`
                        },
                        {
                            "property": "user.userType",
                            "operator": "=",
                            "value": `GUARD`
                        }
                    ]
                },
                sort: "+execTime",
                limit: Config.tableRows,
                offset: infoPage.offset,
                fetchPlan: 'full',
            });
        }
        infoPage.count = await getFilterEntityCount("Task_", raw);
        dataPage = await getFilterEntityData("Task_", raw);
        return dataPage;
    }
    if(Config.currentUser?.isMaster){
        return response();
    }else{
        const permission = await getPermission('TASK_FIXED', Config.currentUser.id);
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

export class Fixed {

    constructor() {
        this.dialogContainer = document.getElementById('app-dialogs');
        this.entityDialogContainer = document.getElementById('entity-editor-container');
        this.content = document.getElementById('datatable-container');
        /*this.searchEntity = async (tableBody, data) => {
            const search = document.getElementById('search');
            await search.addEventListener('keyup', () => {
                const arrayData = data.filter((user) => `${user.name}`
                    .toLowerCase()
                    .includes(search.value.toLowerCase()));
                let filteredResult = arrayData.length;
                let result = arrayData;
                if (filteredResult >= tableRows)
                    filteredResult = tableRows;
                this.load(tableBody, currentPage, result);
                this.pagination(result, tableRows, currentPage);
            });
        };*/
        this.searchEntity = async (tableBody /*, data: any*/) => {
            const search = document.getElementById('search');
            const btnSearch = document.getElementById('btnSearch');
            search.value = infoPage.search;
            await search.addEventListener('keyup', () => {

            });
            btnSearch.addEventListener('click', async () => {
                new Fixed().render(Config.offset, Config.currentPage, search.value.toLowerCase().trim());
            });
        };
    }

    /*async render() {
        this.content.innerHTML = '';
        this.content.innerHTML = tableLayout;
        const tableBody = document.getElementById('datatable-body');
        tableBody.innerHTML = '.Cargando...';
        let data = await getTakFixed();
        tableBody.innerHTML = tableLayoutTemplate.repeat(tableRows);
        this.load(tableBody, currentPage, data);
        this.searchEntity(tableBody, data);
        new filterDataByHeaderType().filter();
        this.pagination(data, tableRows, currentPage);
        tableBody
    }*/
    async render(offset, actualPage, search) {
        infoPage.offset = offset;
        infoPage.currentPage = actualPage;
        infoPage.search = search;
        this.content.innerHTML = '';
        this.content.innerHTML = tableLayout;
        const tableBody = document.getElementById('datatable-body');
        tableBody.innerHTML = '.Cargando...';
        let data = await getTakFixed();
        tableBody.innerHTML = tableLayoutTemplate.repeat(tableRows);
        this.load(tableBody, currentPage, data);
        this.searchEntity(tableBody /*, data*/);
        new filterDataByHeaderType().filter();
        this.pagination(data, tableRows, infoPage.currentPage);
    }
    openTasksModal(container, data) {
        const view = document.querySelectorAll('#view-entity');
        view.forEach((view) => {
            const entityId = view.dataset.entityid;
            view.addEventListener('click', () => {
                RInterface('Task_', entityId);
            });
        });

        const RInterface = async (entities, entityID) => {
            const data = await getEntityData(entities, entityID);
            const dialogContainer = document.getElementById('app-dialogs');
            dialogContainer.innerHTML = `
                <div class="dialog_content" id="dialog-content">
                        <div class="dialog">
                            <div class="dialog_container padding_8" style="width:70%;position: absolute; left: 50%; top: 50%; transform: translate(-50%, -50%);" id="modal">
                                <div class="dialog_header" style="display: flex;justify-content: center;">
                                    <h2 style="margin: 0;">${data.name}</h2>
                                </div>

                                <div class="dialog_message padding_8" style="text-align: center;">
                                    <p style="text-align: justify;">${data.description ?? ""}</p>
                                </div>
                                <div class="dialog_message padding_8" style="display: flex; justify-content: center;">
                                   
                                    <div style="padding:20px;background:#dfdfdf""><span><i class="fa-solid fa-clock"  style="font-size:15px"></i> ${data.execTime}</span></div>
                                    
                                </div>
                                
                                <div class="dialog_footer" style="text-align: center;">
                                    <button class="btn btn_primary" id="cancel-modal">Cerrar</button>
                                    
                                </div>
                            </div>
                    </div>
                </div>
                `;
            const cancelBtnModal = document.getElementById('cancel-modal');
            cancelBtnModal.addEventListener('click', (event) => {

                const dialog = document.getElementById('dialog-content');
                new CloseDialog().x(dialog);


            });
        }
    }

    load(table, currentPage, data) {
        table.innerHTML = '';
        currentPage--;
        let start = tableRows * currentPage;
        let end = start + tableRows;
        let paginatedItems = data.slice(start, end);
        if (data.length === 0) {
            let mensaje = `No existen datos. ${infoPage.msgPermission}`;
            if (customerId == null) { mensaje = 'Seleccione una empresa'; }
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
                let taskFixed = paginatedItems[i];
                let row = document.createElement('tr');
                //row.setAttribute("id", `row${i}`);
                //row.setAttribute("onclick","alerta()")
                row.innerHTML += `
          <td>${taskFixed.name}</dt>
          
          <td>${taskFixed.execTime}</dt>`;
                row.innerHTML += `<td>${taskFixed.isReadDate ?? ''} </dt>`;
                row.innerHTML += `<td>${taskFixed.isReadTime ?? ''}</dt>`;

                row.innerHTML += `

          <td class="entity_options">
            <button class="button" id="view-entity" data-entityId="${taskFixed.id}">
            <i class="fa-solid fa-magnifying-glass"></i>
            </button>
            <button class="button" id="edit-entity" data-entityId="${taskFixed.id}">
              <i class="fa-solid fa-pen"></i>
            </button>
            <button class="button" id="remove-entity" data-entityId="${taskFixed.id}">
              <i class="fa-solid fa-trash"></i>
            </button>
          </dt>
        `;
                table.appendChild(row);
            }

        }
        this.edit(this.entityDialogContainer, data);
        this.register();
        this.remove();
        this.export();
        this.openTasksModal(this.content, data);

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
                new Fixed().render(infoPage.offset, currentPage, infoPage.search);
            });
            return button;
        }
        function pagesOptions(items, currentPage) {
            paginationWrapper.innerHTML = '';
            let pages = pageNumbers(pageCount, Config.maxLimitPage, currentPage);
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
                new Fixed().render(Config.offset, Config.currentPage, infoPage.search);
            });
            nextButton.addEventListener('click', () => {
                infoPage.offset = Config.tableRows * (pageCount - 1);
                new Fixed().render(infoPage.offset, pageCount, infoPage.search);
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
            const notification = await searchUniversalSingle("name", "=", "Consigna", "NotificationType");
            this.entityDialogContainer.innerHTML = '';
            this.entityDialogContainer.style.display = 'flex';
            this.entityDialogContainer.innerHTML = `
        <div class="entity_editor" id="entity-editor">
          <div class="entity_editor_header">
            <div class="user_info">
              <div class="avatar"><i class="fa-solid fa-building"></i></div>
              <h1 class="entity_editor_title">Registrar <br><small>Generales</small></h1>
            </div>

            <button class="btn btn_close_editor" id="close"><i class="fa-regular fa-x"></i></button>
          </div>

          <!-- EDITOR BODY -->
          <div class="entity_editor_body">
            <div class="material_input">
              <input type="text" id="entity-name" autocomplete="none" required>
              <label for="entity-name">Título</label>
            </div>
            
            <div class="form_input">
                <label for="entity-description" class="form_label"></i> Descripción:</label>
                <textarea id="entity-description" name="entity-description" row="30" class="input_textarea"></textarea>
            </div>
            <div class="form_group">
                <div class="form_input">
                    <label class="form_label" for="execution-time">Hora de Ejecución:</label>
                    <input type="time" class="input_time input_time-execution" id="execution-time" name="execution-time">
                </div>

               
            </div> 
           
            
            
        </div>

      
          <!-- END EDITOR BODY -->

          <div class="entity_editor_footer">
            <button class="btn btn_primary btn_widder" id="register-entity">Guardar</button>
          </div>
        </div>
      `;
            // @ts-ignore
            inputObserver();

            this.close();
            const agregarCeros = (numero) => {
                return numero < 10 ? `0${numero}` : numero;
            };
            const _fileHandler = document.getElementById('file-handler');
            const registerButton = document.getElementById('register-entity');
            const fecha = new Date();

            let day = fecha.getDate();
            day = agregarCeros(day);
            let month = fecha.getMonth() + 1;
            month = agregarCeros(month);
            const year = fecha.getFullYear();

            const dateFormat = year + '-' + month + '-' + day;

            const hour = fecha.getHours();
            const minutes = fecha.getMinutes();
            const seconds = fecha.getSeconds();

            const hourFormat = `${hour.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;


            registerButton.addEventListener('click', async (e) => {
                e.preventDefault();
                if(!infoPage.actions.includes("INS") && !Config.currentUser?.isMaster){
                    alert("Usuario no tiene permiso de registrar.");
                }else{
                    const name = document.getElementById('entity-name')
                    const description = document.getElementById('entity-description')
                    const executionTime = document.getElementById('execution-time')

                    const inputsCollection = {
                        name: name,
                        executionTime: executionTime,
                        description: description

                    };
                    //let _userInfo = await getUserInfo();
                    const customerId = localStorage.getItem('customer_id');

                    const raw = JSON.stringify({
                        "taskType": `FIJAS`,
                        "name": `${inputsCollection.name.value}`,
                        "description": `${inputsCollection.description.value}`,
                        "execDate": `${dateFormat}`,
                        "user": {
                            "id": `${Config.currentUser.id}` //`${_userInfo['attributes']['id']}`
                        },
                        "customer": {
                            "id": `${customerId}`
                        },
                        "execTime": `${inputsCollection.executionTime.value}`,
                        "startTime": `${hourFormat}`,
                        "startDate": `${dateFormat}`,

                    });
                    if (name.value.trim() === '' || name.value.trim() === null) {
                        alert('Nombre del consigna fija vacío')
                    }
                    if (executionTime.value.trim() === '' || executionTime.value.trim() === null) {
                        alert('Debe especificar la hora de ejecución de la consigna')
                    }
                    else {
                        reg(raw);
                        let rawUser = JSON.stringify({
                            "filter": {
                                "conditions": [
                                    {
                                        "property": "customer.id",
                                        "operator": "=",
                                        "value": `${customerId}`
                                    },
                                    {
                                        "property": "userType",
                                        "operator": "=",
                                        "value": `GUARD`
                                    },
                                    {
                                        "property": "state.name",
                                        "operator": "=",
                                        "value": `Enabled`
                                    },
                                    {
                                        "property": "token",
                                        "operator": "<>",
                                        "value": ``
                                    }
                                ],
                            },
                        });
                        const dataUser = await getFilterEntityData("User", rawUser);
                        for (let i = 0; i < dataUser.length; i++) {

                            const data = { "token": dataUser[i]['token'], "title": "General", "body": `${inputsCollection.name.value}` }
                            const envioPush = await postNotificationPush(data);
                        }

                    }
                }


            });


            const reg = async (raw) => {
                registerEntity(raw, 'Task_')
                    .then((res) => {
                        let parse = JSON.parse(raw);
                        const notify = JSON.stringify({
                            "user": {
                                "id": `${currentUser.id}`
                            },
                            "customer": {
                                "id": `${customerId}`
                            },
                            "business": {
                                "id": `${currentUser.business.id}`
                            },
                            "title": `${parse.name} | [CONSIGNA]`,
                            "description": `${parse.description} | ${parse.execTime}`,
                            "creationDate": `${dateFormat}`,
                            "creationTime": `${hourFormat}`,
                            "firebaseId": `${currentDateTime().date}T${currentDateTime().timeHHMMSS}`,
                            "notificationType": {
                                "id": `${notification[0].id}`
                            },
                        });
                        registerEntity(notify, 'Notification');
                        setTimeout(async () => {
                            //let data = await getUsers();
                            const tableBody = document.getElementById('datatable-body');
                            const container = document.getElementById('entity-editor-container');
                            new CloseDialog().x(container);
                            new Fixed().render(Config.offset, Config.currentPage, infoPage.search);
                        }, 1000);
                    });
            };
        };

    }
    edit(container, data) {
        // Edit entity
        const edit = document.querySelectorAll('#edit-entity');
        edit.forEach((edit) => {
            const entityId = edit.dataset.entityid;
            edit.addEventListener('click', () => {
                RInterface('Task_', entityId);
            });
        });
        const RInterface = async (entities, entityID) => {
            const data = await getEntityData(entities, entityID);
            this.entityDialogContainer.innerHTML = '';
            this.entityDialogContainer.style.display = 'flex';
            this.entityDialogContainer.innerHTML = `
              <div class="entity_editor" id="entity-editor">
              <div class="entity_editor_header">
                  <div class="user_info">
                  <div class="avatar"><i class="fa-regular fa-user"></i></div>
                  <h1 class="entity_editor_title">Editar <br><small>${data.name} </small></h1>
                  </div>

                  <button class="btn btn_close_editor" id="close"><i class="fa-solid fa-x"></i></button>
              </div>

              <!-- EDITOR BODY -->
              <div class="entity_editor_body">
                    <div class="material_input">
                        <input type="text" id="entity-name" class="input_filled" value="${data.name}" >
                        <label for="entity-name">Título</label>
                    </div>
                    <div class="form_input">
                        <label for="entity-description" class="form_label"></i> Descripción:</label>
                        <textarea id="entity-description" name="entity-description" row="30" class="input_textarea">${data.description}</textarea>
                    </div>
                    <div class="form_group">
                        <div class="form_input">
                            <label class="form_label" for="execution-time">Hora de ejecución:</label>
                            <input type="time" class="input_time input_time-execution" id="execution-time" name="execution-time" value="${data.execTime}">
                        </div>
                    </div>
              </div>
              <!-- END EDITOR BODY -->

              <div class="entity_editor_footer">
                  <button class="btn btn_primary btn_widder" id="update-changes">Guardar</button>
              </div>
              </div>
          `;

            inputObserver();

            this.close();
            UUpdate(entityID);
        };
        const UUpdate = async (entityId) => {
            const notification = await searchUniversalSingle("name", "=", "Consigna", "NotificationType");
            const updateButton = document.getElementById('update-changes');
            const $value = {
                // @ts-ignore
                name: document.getElementById('entity-name'),
                // @ts-ignore
                description: document.getElementById('entity-description'),
                // @ts-ignore
                execTime: document.getElementById('execution-time'),
                // @ts-ignore


            };
            updateButton.addEventListener('click', (e) => {
                e.preventDefault()
                const name = document.getElementById('entity-name')
                const executionTime = document.getElementById('execution-time')
                if(!infoPage.actions.includes("UPD") && !Config.currentUser?.isMaster){
                    alert("Usuario no tiene permiso de actualizar.");
                }else if (name.value.trim() === '' || name.value.trim() === null) {
                    alert('Nombre del consigna fija vacío')
                }
                else if (executionTime.value.trim() === '' || executionTime.value.trim() === null) {
                    alert('Debe especificar la hora de ejecución de la consigna')
                }
                else {
                    let raw = JSON.stringify({
                        // @ts-ignore
                        "name": `${$value.name.value}`,
                        "description": `${$value.description.value}`,
                        // @ts-ignore
                        "execTime": `${$value.execTime.value}`,
                        "isRead": false,
                        "isReadDate": '',
                        "isReadTime": '',
                    });
                    update(raw);
                }
            });
            /**
             * Update entity and execute functions to finish defying user
             * @param raw
             */
            const update = async (raw) => {
                updateEntity('Task_', entityId, raw)
                    .then((res) => {
                        let parse = JSON.parse(raw);
                        const notify = JSON.stringify({
                            "user": {
                                "id": `${currentUser.id}`
                            },
                            "customer": {
                                "id": `${customerId}`
                            },
                            "business": {
                                "id": `${currentUser.business.id}`
                            },
                            "title": `${parse.name} | [CONSIGNA]`,
                            "description": `${parse.description} | ${parse.execTime}`,
                            "creationDate": `${currentDateTime().date}`,
                            "creationTime": `${currentDateTime().timeHHMM}`,
                            "firebaseId": `${currentDateTime().date}T${currentDateTime().timeHHMMSS}`,
                            "notificationType": {
                                "id": `${notification[0].id}`
                            },
                        });
                        registerEntity(notify, 'Notification');
                        setTimeout(async () => {
                            let tableBody;
                            let container;
                            let data;
                            tableBody = document.getElementById('datatable-body');
                            container = document.getElementById('entity-editor-container');
                            //data = await getUsers();
                            new CloseDialog().x(container);
                            new Fixed().render(infoPage.offset, infoPage.currentPage, infoPage.search);
                        }, 100);
                    });


                let rawUser = JSON.stringify({
                    "filter": {
                        "conditions": [
                            {
                                "property": "customer.id",
                                "operator": "=",
                                "value": `${customerId}`
                            },
                            {
                                "property": "userType",
                                "operator": "=",
                                "value": `GUARD`
                            },
                            {
                                "property": "state.name",
                                "operator": "=",
                                "value": `Enabled`
                            },
                            {
                                "property": "token",
                                "operator": "<>",
                                "value": ``
                            }
                        ],
                    },
                });
                const dataUser = await getFilterEntityData("User", rawUser);
                for (let i = 0; i < dataUser.length; i++) {

                    const data = { "token": dataUser[i]['token'], "title": "General", "body": `${$value.name.value}` }
                    const envioPush = await postNotificationPush(data);
                }
            };


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
                    <h2>¿Deseas eliminar este Consigna fija?</h2>
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
                    const deleteButton = document.getElementById('delete');
                    const cancelButton = document.getElementById('cancel');
                    const dialogContent = document.getElementById('dialog-content');
                    deleteButton.onclick = async () => {
                        if(!infoPage.actions.includes("DLT") && !Config.currentUser?.isMaster){
                            alert("Usuario no tiene permiso de eliminar.");
                        }else{
                            deleteEntity('Task_', entityId)
                                .then((res) => {
                                    setTimeout(async () => {
                                        //let data = await getUsers();
                                        const tableBody = document.getElementById('datatable-body');
                                        new CloseDialog().x(dialogContent);
                                        new Fixed().render(infoPage.offset, infoPage.currentPage, infoPage.search);
                                    }, 1000);
                                });
                        }
                    };
                    cancelButton.onclick = () => {
                        new CloseDialog().x(dialogContent);
                        //this.render();
                    };
                }
            });
        });
    }
    export = () => {

        const exportNotes = document.getElementById('export-entities');
        exportNotes.addEventListener('click', async () => {
            if(!infoPage.actions.includes("DWN") && !Config.currentUser?.isMaster){
                alert("Usuario no tiene permiso de exportar.");
            }else{
                this.dialogContainer.style.display = 'block';
                this.dialogContainer.innerHTML = `
                <div class="dialog_content" id="dialog-content">
                    <div class="dialog">
                        <div class="dialog_container padding_8">
                            <div class="dialog_header">
                                <h2>Seleccionar la hora</h2>
                            </div>

                            <div class="dialog_message padding_8">
                                <div class="form_group">
                                    <div class="form_input">
                                        <label class="form_label" for="start-date">Desde:</label>
                                        <input type="time" class="input_date input_time-start" id="start-time" name="start-time">
                                    </div>
                    
                                    <div class="form_input">
                                        <label class="form_label" for="end-date">Hasta:</label>
                                        <input type="time" class="input_date input_time-end" id="end-time" name="end-time">
                                    </div>

                                    <label for="exportCsv">
                                        <input type="radio" id="exportCsv" name="exportOption" value="csv" /> CSV
                                    </label>

                                    <label for="exportXls">
                                        <input type="radio" id="exportXls" name="exportOption" value="xls" checked /> XLS
                                    </label>

                                    <label for="exportPdf">
                                        <input type="radio" id="exportPdf" name="exportOption" value="pdf" /> PDF
                                    </label>
                                </div>
                            </div>

                            <div class="dialog_footer">
                                <button class="btn btn_primary" id="cancel">Cancelar</button>
                                <button class="btn btn_danger" id="export-data">Exportar</button>
                            </div>
                        </div>
                    </div>
                </div>
            `;
                const fecha = new Date();

                const hour = fecha.getHours();
                const minutes = fecha.getMinutes();
                const seconds = fecha.getSeconds();

                const hourFormat = `${hour.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}`;

                document.getElementById("start-time").value = "00:00"
                document.getElementById("end-time").value = hourFormat
                inputObserver();
                const _closeButton = document.getElementById('cancel');
                const exportButton = document.getElementById('export-data');
                const _dialog = document.getElementById('dialog-content');
                exportButton.addEventListener('click', async () => {
                    if(!infoPage.actions.includes("DWN") && !Config.currentUser?.isMaster){
                        alert("Usuario no tiene permiso de exportar.");
                    }else{
                        const _values = {
                            start: document.getElementById('start-time'),
                            end: document.getElementById('end-time'),
                            exportOption: document.getElementsByName('exportOption')
                        }
                        let rawExport = JSON.stringify({
                            "filter": {
                                "conditions": [
                                    {
                                        "property": "taskType",
                                        "operator": "=",
                                        "value": `FIJAS`
                                    },
                                    {
                                        "property": "user.userType",
                                        "operator": "=",
                                        "value": `GUARD`
                                    },
                                    {
                                        "property": "customer.id",
                                        "operator": "=",
                                        "value": `${customerId}`
                                    },
                                    {
                                        "property": "execTime",
                                        "operator": ">=",
                                        "value": `${_values.start.value}`
                                    },
                                    {
                                        "property": "execTime",
                                        "operator": "<=",
                                        "value": `${_values.end.value}`
                                    }
                                ],
                            },
                            sort: "+execTime",
                            fetchPlan: 'full',
                        });
                        const fixed = await getFilterEntityData("Task_", rawExport);
                        for (let i = 0; i < _values.exportOption.length; i++) {
                            let ele = _values.exportOption[i];
                            if (ele.type = "radio") {
                                if (ele.checked) {
                                    if (ele.value == "xls") {
                                        // @ts-ignore
                                        exportFixedXls(fixed, _values.start.value, _values.end.value);
                                    }
                                    else if (ele.value == "csv") {
                                        // @ts-ignore
                                        exportFixedCsv(fixed, _values.start.value, _values.end.value);
                                    }
                                    else if (ele.value == "pdf") {
                                        // @ts-ignore
                                        exportFixedPdf(fixed, _values.start.value, _values.end.value);
                                    }
                                }
                            }
                        }
                    }
                });
                _closeButton.onclick = () => {
                    new CloseDialog().x(_dialog);
                };
            }
        });
    };
    close() {
        const closeButton = document.getElementById('close');
        const editor = document.getElementById('entity-editor-container');
        closeButton.addEventListener('click', () => {
            console.log('close');
            new CloseDialog().x(editor);
        });
    }
}
export const setNewPassword = async () => {
    const users = await getEntitiesData('User');
    const FNewUsers = users.filter((data) => data.isSuper === false);
    FNewUsers.forEach((newUser) => {
    });
    console.group('Nuevos usuarios');
    console.log(FNewUsers);
    console.time(FNewUsers);
    console.groupEnd();
};
