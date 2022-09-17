const { dhis2destination , dhis2source }  = require('./dhis2');
const fs = require('fs');
const csv = require('csv-parser');




const run = async () => {

    // En cas de reprise, supprimer les lignes des annees deja traiter et recuperer le dernier trimester traité dans le fichier des OK
    const periods = [
        { year: 2014, start: 1, end: 4 },
        { year: 2015, start: 1, end: 4 },
        { year: 2016, start: 1, end: 4 },
        { year: 2017, start: 1, end: 4 },
        { year: 2018, start: 1, end: 4 },
        { year: 2019, start: 1, end: 4 },
        { year: 2020, start: 1, end: 4 }
    ]

    const datasets = ['OyutuMOPgkt','lYNYevNTO7B']; 
    const orgunits = [];
    const date = new Date();

    fs.createReadStream('./orgunit.csv').pipe(csv()).on('data', (row) => {
        orgunits.push(row);
    }).on('end', async () => {
        console.log('Debut du traitement .....');

        for (let i = 0; i < periods.length; i++) {

            const period = periods[i];
            let debut = period.start
            while (debut <= period.end) {
                const currentPeriod = `${period.year}Q${debut}`;
                for (let index = 0; index < orgunits.length; index++) {
                    const orgunit = orgunits[index];

                    for (let datasetindex = 0; datasetindex < datasets.length; datasetindex++) {
                        const dataset = datasets[datasetindex];

                        // lire les donnees d'une currentperiod a partir de dhis 2 source
                        try {
                            const datavaluesfromdhis= await dhis2source.get(`/dataValueSets?orgUnit=${orgunit.uid}&dataSet=${dataset}&period=${currentPeriod}`).catch((error) => {
                               console.log(error)
                                fs.writeFile(`./logs/logs_${date.getFullYear()}${date.getMonth()}${date.getDate()}_not_OK.log`, `${orgunit.uid} , ${currentPeriod} \n`, { flag: 'a+' }, err => { })
                                return;
                            });
                            const dataSetValues = datavaluesfromdhis? datavaluesfromdhis.data : null;
                            if (dataSetValues && dataSetValues.dataValues && dataSetValues.dataValues.length > 0) {
                                // Envoi des donnees vers le dhis 2 destination
                                await dhis2destination.post('/dataValueSets?importStrategy=CREATE_AND_UPDATE', JSON.stringify(dataSetValues)).catch((error) => {
                                    console.log(error);
                                    fs.writeFile(`./logs/logs_${date.getFullYear()}${date.getMonth()}${date.getDate()}_not_OK.log`, `${orgunit.uid} , ${currentPeriod} \n`, { flag: 'a+' }, err => { })
                                })
                            }else{
                                fs.writeFile(`./logs/logs_${date.getFullYear()}${date.getMonth()}${date.getDate()}_no_data.log`, `${orgunit.uid} , ${currentPeriod} \n`, { flag: 'a+' }, err => { })
                            }
                        } catch (error) {
                            console.log(error);
                            fs.writeFile(`./logs/logs_${date.getFullYear()}${date.getMonth()}${date.getDate()}_not_OK.log`, `${orgunit.uid} , ${currentPeriod} \n`, { flag: 'a+' }, err => { })
                        }
                    }

                   


                }
                fs.writeFile(`./logs/logs_${date.getFullYear()}${date.getMonth()}${date.getDate()}_OK.log`, `${currentPeriod}\n`, { flag: 'a+' }, err => { })

                debut = debut + 1;
            }
        }
    });
}

run();