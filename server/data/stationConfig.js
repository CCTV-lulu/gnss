var StationConfig = require('mongoose').model('StationConfig');

var config = {
    "mode": 0,
    "nf": 0,
    "navsys": [0, 1, 2],
    "elmin": [10, 10, 10, 10],
    "snrmask": {
        "ena": [1, 0],
        "mask": [
            [35, 35, 35, 35, 35, 35, 35, 35, 35],
            [35, 35, 35, 35, 35, 35, 35, 35, 35],
            [35, 35, 35, 35, 35, 35, 35, 35, 35]
        ]
    },
    "eratio": [100, 100],
    "err": [100, 0.003, 0.003, 0.0, 0.1],
    "ionoopt": 1,
    "tropopt": 1,
    "rbinit": [300, 300, 300, 300],
    "isrb": [0, 0, 0, 0],
    "rb": [
        [0, 0, 0],
        [0, 0, 0],
        [0, 0, 0],
        [0, 0, 0]
    ],
    "mul_vare": 5,
    "init_vare": 100,
    "exsats": [
        [2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2],
        [2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2],
        [2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2]
    ],
    "maxgdop": 30,
    "threshold_PFD": [19.511420964666268, 23.025850929949559, 25.901749745671488, 28.473255424015772,
        30.856189940445915, 33.107056816839268, 35.258536421491371, 37.331593644432907,
        39.340653733879435, 41.296157968771361, 43.205959720550595, 45.076146524171676,
        46.911553128969423, 48.716096902669385, 50.493005581078563, 52.244976887148361,
        53.974293437195691, 55.682907382159975, 57.372504010904251, 59.044550386814500,
        60.700333117964483, 62.340988094296740, 63.967524190167303, 65.580842367549351,
        67.181751227819959, 68.770979788661379, 70.349188069307246, 71.916975927604923,
        73.474890489922245, 75.023432438884356, 76.563061366821884, 78.094200359468132
    ],
    "nclamda_PMD": [56.36114063925065, 60.95684417336723, 64.3806847565203, 67.2440722229457,
        69.7595714995097, 72.0311692257257, 74.119134737117, 76.0621903109013,
        77.887008300136, 79.612909267332, 81.254432512565, 82.8228517985003,
        84.3271224003979, 85.7745008366539, 87.1709660286392, 88.521514673664,
        89.830373998694, 91.1011585513803, 92.3369880659571, 93.5405776224075,
        94.7143076801321, 95.86027922797058, 96.980357749338, 98.07620866024191,
        99.149326161404, 100.2010569434503, 101.23261982627712, 102.245122154836,
        103.239573583795, 104.216897742612, 105.177942166677, 106.12348679984
    ]
}


module.exports = {
    create: function (station) {
        var defer = Promise.defer();
        var newStationConfig = {
            stationName: station.name,
            staId: station.staId,
            config: config,
            threshold: {}

        };
        StationConfig.create(newStationConfig,function(err, data){
            if(err){
                return defer.reject({status:false,message:err})
            }
            return defer.resolve({status:true, message:data})
        });
        return defer.promise;
    },

    findByStaId: function (staId) {
        var defer = Promise.defer();
        StationConfig.findOne({staId: staId}).exec(function (err, station) {
            if (err) {
                return defer.reject('find all station error')
            }
            if (station && station.threshold) {
                return defer.resolve({status: true, threshold: station.threshold})
            }
            defer.resolve({status: false})
        });
        return defer.promise;
    },
    deleteByStaName: function (stationName) {
        return StationConfig.remove({stationName: stationName}).exec()
    }

};