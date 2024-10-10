// @filename: EvetnsView.ts
import { Config } from "../../../Configs.js";
import { getEntityData, getFilterEntityData, getFilterEntityCount } from "../../../endpoints.js";
import { CloseDialog, renderRightSidebar, filterDataByHeaderType, inputObserver, pageNumbers, fillBtnPagination, getPermission } from "../../../tools.js";
import { UIContentLayout, UIRightSidebar } from "./Layout.js";
import { UITableSkeletonTemplate } from "./Template.js";
import { exportBinnacleCsv, exportBinnaclePdf, exportBinnacleXls } from "../../../exportFiles/binnacle.js";
// Local configs
const tableRows = Config.tableRows;
let currentPage = Config.currentPage;
const pageName = 'Bitácora';
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
const getEvents = async () => {
    const response = async () => {
        /*const eventsRaw = await getEntitiesData('Notification');
        const events = eventsRaw.filter((data) => data.customer?.id === `${customerId}`);
        // notificationType.name
        const removeOtroFromList = events.filter((data) => data.notificationType.name !== "Otro");
        const removeFuegoFromList = removeOtroFromList.filter((data) => data.notificationType.name !== '🔥 Fuego');
        const removeCaidoFromList = removeFuegoFromList.filter((data) => data.notificationType.name !== '🚨 Hombre Caído');
        const removeIntrusionFromList = removeCaidoFromList.filter((data) => data.notificationType.name !== '🚪 Intrusión');
        const removeRoboFromList = removeIntrusionFromList.filter((data) => data.notificationType.name !== '🏚 Robo');
        const removePanicoFromList = removeRoboFromList.filter((data) => data.notificationType.name !== 'Botón Pánico');*/
        let raw = JSON.stringify({
            "filter": {
                "conditions": [
                    {
                        "property": "customer.id",
                        "operator": "=",
                        "value": `${customerId}`
                    },
                    {
                        "property": "notificationType.name",
                        "operator": "<>",
                        "value": `Otro`
                    },
                    {
                        "property": "notificationType.name",
                        "operator": "<>",
                        "value": `🔥 Fuego`
                    },
                    {
                        "property": "notificationType.name",
                        "operator": "<>",
                        "value": `🚨 Hombre Caído`
                    },
                    {
                        "property": "notificationType.name",
                        "operator": "<>",
                        "value": `🚪 Intrusión`
                    },
                    {
                        "property": "notificationType.name",
                        "operator": "<>",
                        "value": `🏚 Robo`
                    },
                    {
                        "property": "notificationType.name",
                        "operator": "<>",
                        "value": `Botón Pánico`
                    },
                ],
            },
            sort: "-createdDate",
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
                                    "property": "title",
                                    "operator": "contains",
                                    "value": `${infoPage.search.toLowerCase()}`
                                },
                                {
                                    "property": "description",
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
                            "property": "notificationType.name",
                            "operator": "<>",
                            "value": `Otro`
                        },
                        {
                            "property": "notificationType.name",
                            "operator": "<>",
                            "value": `🔥 Fuego`
                        },
                        {
                            "property": "notificationType.name",
                            "operator": "<>",
                            "value": `🚨 Hombre Caído`
                        },
                        {
                            "property": "notificationType.name",
                            "operator": "<>",
                            "value": `🚪 Intrusión`
                        },
                        {
                            "property": "notificationType.name",
                            "operator": "<>",
                            "value": `🏚 Robo`
                        },
                        {
                            "property": "notificationType.name",
                            "operator": "<>",
                            "value": `Botón Pánico`
                        },
                    ]
                },
                sort: "-createdDate",
                limit: Config.tableRows,
                offset: infoPage.offset,
                fetchPlan: 'full',
            });
        }
        infoPage.count = await getFilterEntityCount("Notification", raw);
        dataPage = await getFilterEntityData("Notification", raw);
        return dataPage;
    }
    if(Config.currentUser?.isMaster){
        return response();
    }else{
        const permission = await getPermission('BINNACLE', Config.currentUser.id);
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
export class Binnacle {
    constructor() {
        this.dialogContainer = document.getElementById('app-dialogs');
        this.siebarDialogContainer = document.getElementById('entity-editor-container');
        this.appContainer = document.getElementById('datatable-container');
        this.render = async (offset, actualPage, search) => {
            infoPage.offset = offset;
            infoPage.currentPage = actualPage;
            infoPage.search = search;
            this.appContainer.innerHTML = '';
            this.appContainer.innerHTML = UIContentLayout;
            // Getting interface elements
            const viewTitle = document.getElementById('view-title');
            const tableBody = document.getElementById('datatable-body');
            // Changing interface element content
            viewTitle.innerText = pageName;
            tableBody.innerHTML = '.Cargando...';
            let eventsArray = await getEvents();
            tableBody.innerHTML = UITableSkeletonTemplate.repeat(tableRows);
            // Exec functions
            this.load(tableBody, currentPage, eventsArray);
            this.searchNotes(tableBody /*, eventsArray*/);
            new filterDataByHeaderType().filter();
            this.pagination(eventsArray, tableRows, infoPage.currentPage);
            this.export();
            // Rendering icons
        };
        this.load = (tableBody, currentPage, events) => {
            
            tableBody.innerHTML = ''; // clean table
            // configuring max table row size
            currentPage--;
            let start = tableRows * currentPage;
            let end = start + tableRows;
            let paginatedItems = events.slice(start, end);
            // Show message if page is empty
            if (events.length === 0) {
                let mensaje = `No existen datos. ${infoPage.msgPermission}`;
                if(customerId == null){mensaje = 'Seleccione una empresa';}
                let row = document.createElement('TR');
                row.innerHTML = `
            <td>${mensaje}<td>
            <td></td>
            <td></td>
            `;
                tableBody.appendChild(row);
            }
            else {
                for (let i = 0; i < paginatedItems.length; i++) {
                    let event = paginatedItems[i]; // getting note items
                    let row = document.createElement('TR');
                    row.innerHTML += `
                    <td>${event.title}</td>
                    <td>${event.description}</td>
                    <td id="table-date">${event.creationDate}</td>
                    <td>
                        <button class="button" id="entity-details" data-entityId="${event.id}">
                            <i class="fa-solid fa-magnifying-glass"></i>
                        </button>
                    </td>
                `;
                    tableBody.appendChild(row);
                    
                    // TODO: Corret this fixer
                    // fixDate()
                }
                this.previewEvent();
            }
        };
        this.searchNotes = async (tableBody /*, events: any*/) => {
            const search = document.getElementById('search');
            const btnSearch = document.getElementById('btnSearch');
            search.value = infoPage.search;
            await search.addEventListener('keyup', () => {
                /*const arrayEvents = events.filter((event) => `${event.title}
                ${event.description}
                ${event.creationDate}`
                    .toLowerCase()
                    .includes(search.value.toLowerCase()));
                let filteredEvents = arrayEvents.length;
                let result = arrayEvents;
                if (filteredEvents >= Config.tableRows)
                    filteredEvents = Config.tableRows;
                this.load(tableBody, currentPage, result);
                this.pagination(result, tableRows, currentPage);
                // Rendering icons*/
            });
            btnSearch.addEventListener('click', async () => {
                new Binnacle().render(Config.offset, Config.currentPage, search.value.toLowerCase().trim());
            });
        };
        this.previewEvent = async () => {
            const openPreview = document.querySelectorAll('#entity-details');
            openPreview.forEach((preview) => {
                let currentEventId = preview.dataset.entityid;
                preview.addEventListener('click', () => {
                    previewBox(currentEventId);
                });
            });
            const previewBox = async (noteId) => {
                const event = await getEntityData('Notification', noteId);
                renderRightSidebar(UIRightSidebar);
                const sidebarContainer = document.getElementById('entity-editor-container');
                const closeSidebar = document.getElementById('close');
                closeSidebar.addEventListener('click', () => {
                    new CloseDialog().x(sidebarContainer);
                });
                // Event details
                const _details = {
                    title: document.getElementById('event-title'),
                    content: document.getElementById('event-content'),
                    author: document.getElementById('event-author'),
                    authorId: document.getElementById('event-author-id'),
                    date: document.getElementById('creation-date'),
                    time: document.getElementById('creation-time')
                };
                /*const eventCreationDateAndTime = event.creationDate.split('T');
                const eventCreationTime = eventCreationDateAndTime[1];
                const eventCreationDate = eventCreationDateAndTime[0];*/
                _details.title.innerText = event.title;
                _details.content.innerText = event.description;
                _details.author.value = `${event.user.firstName} ${event.user.lastName}`;
                _details.authorId.value = event.createdBy;
                _details.date.value = event.creationDate;
                _details.time.value = event.creationTime;
            };
        };
        this.closeRightSidebar = () => {
            const closeButton = document.getElementById('close');
            const editor = document.getElementById('entity-editor-container');
            closeButton.addEventListener('click', () => {
                new CloseDialog().x(editor);
            });
        };
        this.export = () => {
            const exportNotes = document.getElementById('export-entities');
            exportNotes.addEventListener('click', async() => {
                if(!infoPage.actions.includes("DWN") && !Config.currentUser?.isMaster){
                    alert("Usuario no tiene permiso de exportar.");
                }else{
                    this.dialogContainer.style.display = 'block';
                    this.dialogContainer.innerHTML = `
                        <div class="dialog_content" id="dialog-content">
                            <div class="dialog">
                                <div class="dialog_container padding_8">
                                    <div class="dialog_header">
                                        <h2>Seleccionar la fecha</h2>
                                    </div>

                                    <div class="dialog_message padding_8">
                                        <div class="form_group">
                                            <div class="form_input">
                                                <label class="form_label" for="start-date">Desde:</label>
                                                <input type="date" class="input_date input_date-start" id="start-date" name="start-date">
                                            </div>
                            
                                            <div class="form_input">
                                                <label class="form_label" for="end-date">Hasta:</label>
                                                <input type="date" class="input_date input_date-end" id="end-date" name="end-date">
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
                    let fecha = new Date(); //Fecha actual
                    let mes = fecha.getMonth()+1; //obteniendo mes
                    let dia = fecha.getDate(); //obteniendo dia
                    let anio = fecha.getFullYear(); //obteniendo año
                    if(dia<10)
                        dia='0'+dia; //agrega cero si el menor de 10
                    if(mes<10)
                        mes='0'+mes //agrega cero si el menor de 10

                    document.getElementById("start-date").value = anio+"-"+mes+"-"+dia;
                    document.getElementById("end-date").value = anio+"-"+mes+"-"+dia;
                    inputObserver();
                    const _closeButton = document.getElementById('cancel');
                    const exportButton = document.getElementById('export-data');
                    const _dialog = document.getElementById('dialog-content');
                    exportButton.addEventListener('click', async() => {
                        if(!infoPage.actions.includes("DWN") && !Config.currentUser?.isMaster){
                            alert("Usuario no tiene permiso de exportar.");
                        }else{
                            const _values = {
                                start: document.getElementById('start-date'),
                                end: document.getElementById('end-date'),
                                exportOption: document.getElementsByName('exportOption')
                            }
                            let rawExport = JSON.stringify({
                                "filter": {
                                    "conditions": [
                                        {
                                            "property": "customer.id",
                                            "operator": "=",
                                            "value": `${customerId}`
                                        },
                                        {
                                            "property": "notificationType.name",
                                            "operator": "<>",
                                            "value": `Otro`
                                        },
                                        {
                                            "property": "notificationType.name",
                                            "operator": "<>",
                                            "value": `🔥 Fuego`
                                        },
                                        {
                                            "property": "notificationType.name",
                                            "operator": "<>",
                                            "value": `🚨 Hombre Caído`
                                        },
                                        {
                                            "property": "notificationType.name",
                                            "operator": "<>",
                                            "value": `🚪 Intrusión`
                                        },
                                        {
                                            "property": "notificationType.name",
                                            "operator": "<>",
                                            "value": `🏚 Robo`
                                        },
                                        {
                                            "property": "notificationType.name",
                                            "operator": "<>",
                                            "value": `Botón Pánico`
                                        },
                                        {
                                            "property": "creationDate",
                                            "operator": ">=",
                                            "value": `${_values.start.value}`
                                        },
                                        {
                                            "property": "creationDate",
                                            "operator": "<=",
                                            "value": `${_values.end.value}`
                                        }
                                    ],
                                },
                                sort: "-createdDate",
                                fetchPlan: 'full',
                            });
                            const events = await getFilterEntityData("Notification", rawExport); //await getEvents();
                            for (let i = 0; i < _values.exportOption.length; i++) {
                                let ele = _values.exportOption[i];
                                if (ele.type = "radio") {
                                    if (ele.checked) {
                                        if (ele.value == "xls") {
                                            // @ts-ignore
                                            exportBinnacleXls(events, _values.start.value, _values.end.value);
                                        }
                                        else if (ele.value == "csv") {
                                            // @ts-ignore
                                            exportBinnacleCsv(events, _values.start.value, _values.end.value);
                                        }
                                        else if (ele.value == "pdf") {
                                            // @ts-ignore
                                            exportBinnaclePdf(events, _values.start.value, _values.end.value);
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
                new Binnacle().render(infoPage.offset, currentPage, infoPage.search); //new Binnacle().load(tableBody, page, items)
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
                new Binnacle().render(Config.offset, Config.currentPage, infoPage.search);
            });
            nextButton.addEventListener('click', () => {
                infoPage.offset = Config.tableRows * (pageCount - 1);
                new Binnacle().render(infoPage.offset, pageCount, infoPage.search);
            });
        }
    }
}
