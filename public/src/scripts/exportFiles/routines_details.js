//import {generateFile } from "../tools";
export const exportRoutineDetailPdf = (ar, start, end) => {
    // @ts-ignore
    window.jsPDF = window.jspdf.jsPDF;
    // @ts-ignore
    var doc = new jsPDF();
    doc.addImage("./public/src/assets/pictures/report.png", "PNG", 10, 10, 30, 10);
    doc.setDrawColor(0, 0, 128);
    doc.setFont(undefined, 'bold');
    doc.setTextColor(0, 0, 128);
    doc.setFontSize(25);
    doc.text(10, 30, `Registros de Rutinas`);
    doc.setFontSize(10);
    doc.setTextColor(0, 0, 0);
    doc.setFont(undefined, 'italic');
    doc.text(135, 30, `Fecha: Desde ${start} Hasta ${end}`);
    //construimos cabecera del csv
    doc.setFont(undefined, 'bold');
    doc.line(5, 34.8, 205, 34.8);
    doc.setFillColor(210, 210, 210);
    doc.rect(5, 35, 200, 10, 'F');
    doc.text(10, 40, "Fecha");
    doc.text(40, 40, "Estado");
    doc.text(60, 40, "Rutina");
    doc.text(90, 40, "Ubicación");
    doc.text(120, 40, "Usuario");
    doc.text(160, 40, "Observación");
    doc.line(5, 45, 205, 45);
    let row = 50;
    let pagina = 1;
    doc.setTextColor(0, 0, 128);
    doc.text(10, 290, `Página ${pagina}`);
    //resto del contenido
    for (let i = 0; i < ar.length; i++) {
        let register = ar[i];
        let rowAtt = {
            rutina: 0,
            ubicacion: 0,
            usuario: 0,
            observacion: 0
        }
        doc.setFontSize(8);
        doc.setFont(undefined, 'normal');
        doc.setTextColor(0, 0, 0);
        doc.text(10, row, `${register.fecha}`);
        doc.text(25, row, `${register.hora}`);
        if(register.estado == "No cumplido"){
            doc.setTextColor(255, 0, 0);
        }
        doc.text(40, row, `${register.estado}`);

        doc.setTextColor(0, 0, 0);
        var lMargin = 60; //left margin in mm
        var rMargin = 5; //right margin in mm
        var pdfInMM = 90; //210;  // width of A4 in mm
        var paragraph = doc.splitTextToSize(register.rutina, (pdfInMM - lMargin - rMargin));
        doc.text(lMargin, row, paragraph);
        rowAtt.rutina = calculateRow(register.rutina.length,"rutina");

        lMargin = 90; //left margin in mm
        rMargin = 5; //right margin in mm
        pdfInMM = 120; //210;  // width of A4 in mm
        paragraph = doc.splitTextToSize(register.ubicacion, (pdfInMM - lMargin - rMargin));
        doc.text(lMargin, row, paragraph);
        rowAtt.ubicacion = calculateRow(register.ubicacion.length,"ubicacion");

        var lMargin = 120; //left margin in mm
        var rMargin = 5; //right margin in mm
        var pdfInMM = 160; //210;  // width of A4 in mm
        var paragraph = doc.splitTextToSize(register.usuario, (pdfInMM - lMargin - rMargin));
        doc.text(lMargin, row, paragraph);
        rowAtt.usuario = calculateRow(register.usuario.length,"usuario");

        lMargin = 160; //left margin in mm
        rMargin = 5; //right margin in mm
        pdfInMM = 210; //210;  // width of A4 in mm
        paragraph = doc.splitTextToSize(register.observacion, (pdfInMM - lMargin - rMargin));
        doc.text(lMargin, row, paragraph);
        rowAtt.observacion = calculateRow(register.observacion.length,"observacion");

        row += Math.max(rowAtt.rutina, rowAtt.ubicacion, rowAtt.usuario, rowAtt.observacion);
        if(register.imagen != ''){
            doc.addImage(`${register.imagen}`, "JPEG", 80, row, 50, 30);
            row+=35
        }
        doc.setDrawColor(210, 210, 210);
        doc.line(5, row, 205, row);
        if ((row+newDataBlock(ar,i)) > 280) {
            doc.addPage();
            row = 30;
            pagina += 1;
            doc.setFontSize(10);
            doc.setFont(undefined, 'italic');
            doc.text(135, 10, `Fecha: Desde ${start} Hasta ${end}`);
            doc.setFont(undefined, 'bold');
            //construimos cabecera del csv
            doc.setDrawColor(0, 0, 128);
            doc.line(5, 15, 205, 15);
            doc.setFillColor(210, 210, 210);
            doc.rect(5, 15, 200, 10, 'F');
            doc.text(10, 20, "Fecha");
            doc.text(40, 20, "Estado");
            doc.text(60, 20, "Rutina");
            doc.text(90, 20, "Ubicación");
            doc.text(120, 20, "Usuario");
            doc.text(160, 20, "Observación");
            doc.line(5, 25, 205, 25);
            doc.setTextColor(0, 0, 128);
            doc.text(10, 290, `Página ${pagina}`);
        }else{
            row += 5;
        }
    }
    // Save the PDF
    var d = new Date();
    var title = "log_DetallesRutinas_" + d.getDate() + "_" + (d.getMonth() + 1) + "_" + d.getFullYear() + `.pdf`;
    doc.save(title);
};
export const exportRoutineDetailCsv = (ar, start, end) => {
    let rows = [];
    for (let i = 0; i < ar.length; i++) {
        let register = ar[i];
        // @ts-ignore
        //if (noteCreationDate >= start && noteCreationDate <= end) {
            let obj = {
                "Fecha": `${register.creationDate}`,
                "Hora": `${register.creationTime}`,
                "Estado": `${register?.routineState?.name ?? ''}`,
                "Rutina": `${register?.routine?.name.split("\n").join(". ").replace(/[\uE000-\uF8FF]|\uD83C[\uDC00-\uDFFF]|\uD83D[\uDC00-\uDFFF]|[\u2580-\u27BF]|\uD83E[\uDD10-\uDDFF]/g, '').trim()}`,
                "Ubicación": `${register?.routineSchedule?.name.split("\n").join(". ").replace(/[\uE000-\uF8FF]|\uD83C[\uDC00-\uDFFF]|\uD83D[\uDC00-\uDFFF]|[\u2580-\u27BF]|\uD83E[\uDD10-\uDDFF]/g, '').trim()}`,
                "Usuario": `${register.user?.firstName ?? ''} ${register.user?.lastName ?? ''}`,
                "Coordenadas (Lat, Long)": `${register?.cords ?? ''}`,
                "Fecha desde:": `${register?.targetDate ?? ''} ${register?.targetTime ?? ''}`,
                "Fecha hasta:": `${register?.targetDate2 ?? ''} ${register?.targetTime2 ?? ''}`,
                "Observación": `${register?.observation?.split("\n").join(". ").replace(/[\uE000-\uF8FF]|\uD83C[\uDC00-\uDFFF]|\uD83D[\uDC00-\uDFFF]|[\u2580-\u27BF]|\uD83E[\uDD10-\uDDFF]/g, '').trim() ?? ''}`,
            };
            rows.push(obj);
        //}
    }
    generateFile(rows, "DetallesRutinas", "csv");
};
export const exportRoutineDetailXls = (ar, start, end) => {
    let rows = [];
    for (let i = 0; i < ar.length; i++) {
        let register = ar[i];
        // @ts-ignore
        //if (noteCreationDate >= start && noteCreationDate <= end) {
            let obj = {
                "Fecha": `${register.creationDate}`,
                "Hora": `${register.creationTime}`,
                "Estado": `${register?.routineState?.name ?? ''}`,
                "Rutina": `${register?.routine?.name.split("\n").join(". ").replace(/[\uE000-\uF8FF]|\uD83C[\uDC00-\uDFFF]|\uD83D[\uDC00-\uDFFF]|[\u2580-\u27BF]|\uD83E[\uDD10-\uDDFF]/g, '').trim()}`,
                "Ubicación": `${register?.routineSchedule?.name.split("\n").join(". ").replace(/[\uE000-\uF8FF]|\uD83C[\uDC00-\uDFFF]|\uD83D[\uDC00-\uDFFF]|[\u2580-\u27BF]|\uD83E[\uDD10-\uDDFF]/g, '').trim()}`,
                "Usuario": `${register.user?.firstName ?? ''} ${register.user?.lastName ?? ''}`,
                "Coordenadas (Lat, Long)": `${register?.cords ?? ''}`,
                "Fecha desde:": `${register?.targetDate ?? ''} ${register?.targetTime ?? ''}`,
                "Fecha hasta:": `${register?.targetDate2 ?? ''} ${register?.targetTime2 ?? ''}`,
                "Observación": `${register?.observation?.split("\n").join(". ").replace(/[\uE000-\uF8FF]|\uD83C[\uDC00-\uDFFF]|\uD83D[\uDC00-\uDFFF]|[\u2580-\u27BF]|\uD83E[\uDD10-\uDDFF]/g, '').trim() ?? ''}`,
            };
            rows.push(obj);
        //}
    }
    generateFile(rows, "DetallesRutinas", "xls");
};
const generateFile = (ar, title, extension) => {
    //comprobamos compatibilidad
    if (window.Blob && (window.URL || window.webkitURL)) {
        var contenido = "", d = new Date(), blob, reader, save, clicEvent;
        //creamos contenido del archivo
        for (var i = 0; i < ar.length; i++) {
            //construimos cabecera del csv
            if (i == 0)
                contenido += Object.keys(ar[i]).join(";") + "\n";
            //resto del contenido
            contenido += Object.keys(ar[i]).map(function (key) {
                return ar[i][key];
            }).join(";") + "\n";
        }
        //creamos el blob
        blob = new Blob(["\ufeff", contenido], { type: `text/${extension}` });
        //creamos el reader
        // @ts-ignore
        var reader = new FileReader();
        reader.onload = function (event) {
            //escuchamos su evento load y creamos un enlace en dom
            save = document.createElement('a');
            // @ts-ignore
            save.href = event.target.result;
            save.target = '_blank';
            //aquí le damos nombre al archivo
            save.download = "log_" + title + "_" + d.getDate() + "_" + (d.getMonth() + 1) + "_" + d.getFullYear() + `.${extension}`;
            try {
                //creamos un evento click
                clicEvent = new MouseEvent('click', {
                    'view': window,
                    'bubbles': true,
                    'cancelable': true
                });
            }
            catch (e) {
                //si llega aquí es que probablemente implemente la forma antigua de crear un enlace
                clicEvent = document.createEvent("MouseEvent");
                // @ts-ignore
                clicEvent.click();
            }
            //disparamos el evento
            save.dispatchEvent(clicEvent);
            //liberamos el objeto window.URL
            (window.URL || window.webkitURL).revokeObjectURL(save.href);
        };
        //leemos como url
        reader.readAsDataURL(blob);
    }
    else {
        //el navegador no admite esta opción
        alert("Su navegador no permite esta acción");
    }
};

const calculateRow = (length, mode) => {
    let row = 0;
    let limit = 0; // limite de lineas
    if(mode=="rutina"){
        limit = 16;
    }else if(mode=="ubicacion"){
        limit = 16;
    }else if(mode=="usuario"){
        limit = 21;
    }else if(mode=="observacion"){
        limit = 32;
    }
    let lineCount = Math.ceil(length / limit);
    for(let i = 1; i <= lineCount; i++){
        if(length <= (limit * i)){  //124 caracteres cada linea aprox en total margen A4
            row += (4*i);
        }
    }
    return row;
}

const newDataBlock = (array, index) => {
    let row = 0;
    if(array[index+1] != undefined){
        row+=5;
        let rowAtt = {
            rutina: calculateRow(array[index+1]?.rutina.length,"rutina"),
            ubicacion: calculateRow(array[index+1]?.ubicacion.length,"ubicacion"),
            usuario: calculateRow(array[index+1]?.usuario.length,"usuario"),
            observacion: calculateRow(array[index+1]?.observacion.length,"observacion")
        }
        row += Math.max(rowAtt.rutina, rowAtt.ubicacion, rowAtt.usuario, rowAtt.observacion);
        if(array[index+1]?.imagen != '')
            row+=35
    }
    return row;
}