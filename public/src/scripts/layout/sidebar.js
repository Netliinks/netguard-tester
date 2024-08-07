// Views
import { Config } from ".././Configs.js";
import { currentDateTime } from ".././tools.js";
import { Dashboard } from "../views/dashboard/dashboard.js";
import { Notes } from "../views/binnacle/notes/NotesView.js";
import { Guards } from "../views/users/guards/guards.js";
import { Clients } from "../views/users/clients/clients.js";
import { Visits } from "../views/binnacle/visits/VisitsView.js";
import { Employees } from "../views/users/employees/employees.js";
// @ts-ignore
import { Contractors } from "../views/users/contractors/Contractors.js";
import { AssistControl } from "../views/attendance/assistcontrol/AssistControl.js";
import { Departments } from "../views/departments/Departments.js";
import { Customers } from "../views/customers/Customers.js";
import { SuperUsers } from "../views/users/SuperUsers/SuperUsers.js";
import { Events } from "../views/binnacle/Events/EventsView.js";
import { Vehiculars } from "../views/binnacle/vehiculars/Vehiculars.js";
import { Binnacle } from "../views/binnacle/binnacle/BinnacleView.js";
import { Blacklist } from "../views/users/blacklist/blacklist.js";
import { AssistGestion } from "../views/attendance/assistgestion/AssistGestion.js";
//import { TasksTime } from "../views/assignment/tasks/taskstime/TasksTime.js";
import { Fixed } from "../views/assignment/tasks/fixed/Fixed.js";
import { Sporadic } from "../views/assignment/tasks/sporadic/Sporadic.js";
import { Procedures } from "../views/assignment/procedures/Procedures.js";
//import { Tasks } from "../views/assignment/tasks/Tasks.js";
import { Routines } from "../views/routines/routines/Routines.js";
import { RoutineRegisters } from "../views/routines/details/Details.js";
export class Sidebar {
  constructor() {
      this.sidebarContainer = document.getElementById('app-sidebar');
      this.getSidebarItems = () => {
          const sidebarItems = document.querySelectorAll('.sidebar_item');
          const sidebarSubitems = document.querySelectorAll('.sidebar_subitem');
          sidebarItems.forEach((sidebarItem) => {
              sidebarItem.addEventListener('click', () => {
                  sidebarItems.forEach((sidebarItem) => sidebarItem.classList.remove('isActive'));
                  sidebarItem.classList.add('isActive');
              });
          });
          sidebarSubitems.forEach((sidebarSubitem) => {
              sidebarSubitem.addEventListener('click', () => {
                  sidebarSubitems.forEach((sidebarSubitem) => sidebarSubitem.classList.remove('isActive'));
                  sidebarSubitem.classList.add('isActive');
              });
          });
      };
  }
  render() {
      this.sidebarContainer.innerHTML = `
    <div class="app_sidebar_container">
      <div class="app_sidebar_container_menu">
        <div class="sidebar_top">
          <div class="sidebar_header"></div>

          <div class="sidebar_items" style="overflow-y:scroll; height: 100%; max-height: 45rem;">
            <div class="sidebar_item">
              <span class="sidebar_item_label" id="render-dashboard">
                <i class="fa-regular fa-chart-simple"></i> <div class="label">Dashboard</div>
              </span>
            </div>

            <div class="sidebar_item" id="render-customers">
              <span class="sidebar_item_label">
                <i class="fa-regular fa-briefcase"></i> <div class="label">Empresas</div>
              </span>
            </div>

            <div class="sidebar_item">
              <span class="sidebar_item_label">
              <i class="fa-regular fa-user"></i> <div class="label">Usuarios</div>
              </span>

              <div class="sidebar_subitems">

                <div class="sidebar_subitem" id="render-guards">
                  <span class="sidebar_subitem_label">
                    <i class="fa-regular fa-person-military-pointing"></i> <div class="label">Guardias</div>
                  </span>
                </div>

                <div class="sidebar_subitem" id="render-clients">
                  <span class="sidebar_subitem_label">
                    <i class="fa-regular fa-user-group"></i> <div class="label">Clientes</div>
                  </span>
                </div>

                <div class="sidebar_subitem">
                  <span class="sidebar_subitem_label" id="render-employees">
                    <i class="fa-regular fa-users"></i> <div class="label">Empleados</div>
                  </span>
                </div>

                <div class="sidebar_subitem">
                  <span class="sidebar_subitem_label" id="render-contractors">
                    <i class="fa-regular fa-briefcase"></i> <div class="label">Contratistas</div>
                  </span>
                </div>

                <div class="sidebar_subitem">
                  <span class="sidebar_subitem_label" id="render-blacklist">
                    <i class="fa-regular fa-exclamation-triangle"></i> <div class="label">Lista Negra</div>
                  </span>
                </div>

              </div>
            </div>

            <div class="sidebar_item">
              <span class="sidebar_item_label">
              <i class="fa-regular fa-cabinet-filing"></i></i> <div class="label">Registros</div>
              </span>

              <div class="sidebar_subitems">
                <div class="sidebar_subitem" id="render-notes">
                  <span class="sidebar_subitem_label">
                    <i class="fa-regular fa-notes"></i> <div class="label">Reportes</div>
                  </span>
                </div>

                <div class="sidebar_subitem" id="render-visits">
                  <span class="sidebar_subitem_label">
                    <i class="fa-regular fa-user"></i> <div class="label">Visitas</div>
                  </span>
                </div>

                <div class="sidebar_subitem" id="render-events">
                  <span class="sidebar_subitem_label">
                    <i class="fa-regular fa-megaphone"></i> <div class="label">Eventos</div>
                  </span>
                </div>

                <div class="sidebar_subitem" id="render-binnacle">
                  <span class="sidebar_subitem_label">
                    <i class="fa-regular fa-book"></i> <div class="label">Bitácora</div>
                  </span>
                </div>

                <div class="sidebar_subitem" id="render-vehiculars">
                  <span class="sidebar_subitem_label">
                    <i class="fa-regular fa-car"></i> <div class="label">Ingreso Vehicular</div>
                  </span>
                </div>
              </div>
            </div>

            <div class="sidebar_item" id="render-deparments">
              <span class="sidebar_item_label">
                <i class="fa-regular fa-building"></i> <div class="label">Departamentos</div>
              </span>
            </div>

            <div class="sidebar_item" id="render-superusers">
              <span class="sidebar_item_label">
                <i class="fa-regular fa-shield"></i> <div class="label">Superusuarios</div>
              </span>
            </div>

            <div class="sidebar_item">
              <span class="sidebar_item_label">
              <i class="fa-regular fa-calendar"></i></i> <div class="label">Asistencia</div>
              </span>

              <div class="sidebar_subitems">

                <div class="sidebar_subitem" id="render-assistControl">
                  <span class="sidebar_subitem_label">
                    <i class="fa-regular fa-marker"></i> <div class="label">Control</div>
                  </span>
                </div>

                <div class="sidebar_subitem" id="render-assistGestion">
                  <span class="sidebar_subitem_label">
                    <i class="fa-regular fa-list-alt"></i> <div class="label">Gestión</div>
                  </span>
                </div>

              </div>
            </div>
            <div class="sidebar_item">
              <span class="sidebar_item_label">
              <i class="fa-regular fa-walkie-talkie"></i></i> <div class="label">Asignaciones</div>
              </span>

              <div class="sidebar_subitems">

                <div class="sidebar_subitem" id="render-tasks">
                  <span class="sidebar_subitem_label">
                    <i class="fa-regular fa-walkie-talkie"></i> <div class="label">Consignas</div>
                  </span>
                  <div class="sidebar_subitems">
                    <!--div class="sidebar_subitem" id="render-taskstime">
                      <span class="sidebar_subitem_label">
                        <i class="fa-regular fa-timer"></i><div class="label">Tiempo</div>
                      </span>
                    </div-->
                    <div class="sidebar_subitem" id="render-fixed">
                      <span class="sidebar_subitem_label">
                        <i class="fa-regular fa-calendar-check"></i><div class="label">Generales</div>
                      </span>
                    </div>
                    <div class="sidebar_subitem" id="render-sporadic">
                      <span class="sidebar_subitem_label">
                        <i class="fa-regular fa-clock"></i> <div class="label">Específicas</div>
                      </span>
                  </div>
                  </div> 

                </div>

                <div class="sidebar_subitem" id="render-procedures">
                  <span class="sidebar_subitem_label">
                    <i class="fa-regular fa-file"></i> <div class="label">Procedimientos</div>
                  </span>
                </div>

              </div>
            </div>
            
            <div class="sidebar_item">
              <span class="sidebar_item_label">
              <i class="fa-regular fa-alarm-clock"></i></i> <div class="label">Rutinas</div>
              </span>

              <div class="sidebar_subitems">

                <div class="sidebar_subitem" id="render-routineConfiguration">
                  <span class="sidebar_subitem_label">
                    <i class="fa-regular fa-gear"></i> <div class="label">Configurar</div>
                  </span>
                </div>

                <div class="sidebar_subitem" id="render-routineDetails">
                  <span class="sidebar_subitem_label">
                    <i class="fa-regular fa-clipboard-list"></i> <div class="label">Registros</div>
                  </span>
                </div>

              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  `;
  clearTimeout(Config.timeOut);
  this.getSidebarItems();
  this.renders();
}
renders() {
    document.getElementById('render-dashboard')?.addEventListener('click', () => {
      clearTimeout(Config.timeOut);
      new Dashboard().render();
    });
    document.getElementById('render-customers')?.addEventListener('click', () => {
      clearTimeout(Config.timeOut);
      new Customers().render(Config.offset, Config.currentPage, "");
    });
    document.getElementById('render-guards')?.addEventListener('click', () => {
      clearTimeout(Config.timeOut);
        new Guards().render(Config.offset, Config.currentPage, "");
    });
    document.getElementById('render-clients')?.addEventListener('click', () => {
      clearTimeout(Config.timeOut);
        new Clients().render(Config.offset, Config.currentPage, "");
    });
    document.getElementById('render-employees')?.addEventListener('click', () => {
      clearTimeout(Config.timeOut);
        new Employees().render(Config.offset, Config.currentPage, "");
    });
    document.getElementById('render-contractors')?.addEventListener('click', () => {
      clearTimeout(Config.timeOut);
        new Contractors().render(Config.offset, Config.currentPage, "");
    });
    document.getElementById('render-blacklist')?.addEventListener('click', () => {
      clearTimeout(Config.timeOut);
        new Blacklist().render(Config.offset, Config.currentPage, "");
    });
    // render notes
    document.getElementById('render-notes')?.addEventListener('click', () => {
      clearTimeout(Config.timeOut);
        new Notes().render(Config.offset, Config.currentPage, "");
    });
    // render visits
    document.getElementById('render-visits')?.addEventListener('click', () => {
      clearTimeout(Config.timeOut);
        new Visits().render(Config.offset, Config.currentPage, "");
    });
    document.getElementById('render-binnacle')?.addEventListener('click', () => {
      clearTimeout(Config.timeOut);
      new Binnacle().render(Config.offset, Config.currentPage, "");
  });
    // render AssistControl
    document.getElementById('render-assistControl')?.addEventListener('click', () => {
      clearTimeout(Config.timeOut);
      new AssistControl().render(Config.offset, Config.currentPage, "");
    });
    // render AssistGestion
    document.getElementById('render-assistGestion')?.addEventListener('click', () => {
      clearTimeout(Config.timeOut);
      new AssistGestion().render("", currentDateTime().date);
  });
    // render AssistControl
    document.getElementById('render-events')?.addEventListener('click', () => {
      clearTimeout(Config.timeOut);
        new Events().render(Config.offset, Config.currentPage, "");
    });
    // render AssistControl
    document.getElementById('render-vehiculars')?.addEventListener('click', () => {
      clearTimeout(Config.timeOut);
      new Vehiculars().render(Config.offset, Config.currentPage, "");
    });
    // render Deparments
    document.getElementById('render-deparments')?.addEventListener('click', () => {
      clearTimeout(Config.timeOut);
        new Departments().render(Config.offset, Config.currentPage, "");
    });
    // render Superusers
    document.getElementById('render-superusers')?.addEventListener('click', () => {
      clearTimeout(Config.timeOut);
        new SuperUsers().render(Config.offset, Config.currentPage, "");
    });
    
    // render Tasks Fixed
    /*document.getElementById('render-taskstime')?.addEventListener('click', () => {
      new TasksTime().render();
    });*/
    document.getElementById('render-fixed')?.addEventListener('click', () => {
      clearTimeout(Config.timeOut);
      new Fixed().render(Config.offset, Config.currentPage, "");
    });
     // render Tasks Sporadic
    document.getElementById('render-sporadic')?.addEventListener('click', () => {
      clearTimeout(Config.timeOut);
      new Sporadic().render(Config.offset, Config.currentPage, "");
    });

    // render Procedures
    document.getElementById('render-procedures')?.addEventListener('click', () => {
      clearTimeout(Config.timeOut);
      new Procedures().render(Config.offset, Config.currentPage, "");
    });

    document.getElementById('render-routineConfiguration')?.addEventListener('click', () => {
      clearTimeout(Config.timeOut);
      new Routines().render(Config.offset, Config.currentPage, "");
    });

    document.getElementById('render-routineDetails')?.addEventListener('click', () => {
      clearTimeout(Config.timeOut);
      new RoutineRegisters().render(Config.offset, Config.currentPage, "", false);
    });
  }
}
// new Clients().render()
// new AssistControl().render()
// new Notes().render()
//new Employees().render();
// new Contractors().render()
