// ===== SISTEMA DE PROYECCIONES Y CRS REGIONAL =====
// Gestión centralizada de sistemas de coordenadas y reproyecciones

/**
 * Definiciones de CRS regionales para Ecuador y región andina
 * Basado en la normativa del Instituto Geográfico Militar (IGM) del Ecuador
 */

// Definiciones de sistemas de coordenadas para Ecuador
const CRS_ECUADOR = {
    // Sistema Nacional WGS84 - EPSG:4326
    WGS84: {
        epsg: 'EPSG:4326',
        proj4: '+proj=longlat +datum=WGS84 +no_defs',
        name: 'WGS84 Geographic',
        description: 'Sistema de Coordenadas Geográficas Mundial',
        units: 'degrees',
        region: 'Mundial'
    },
    
    // UTM Zonas específicas para Ecuador
    UTM_17S: {
        epsg: 'EPSG:32717',
        proj4: '+proj=utm +zone=17 +south +datum=WGS84 +units=m +no_defs',
        name: 'WGS84 / UTM Zone 17S',
        description: 'UTM Zona 17 Sur - Ecuador Continental Occidental',
        units: 'meters',
        region: 'Ecuador Occidental',
        zone: 17,
        hemisphere: 'S'
    },
    
    UTM_18S: {
        epsg: 'EPSG:32718',
        proj4: '+proj=utm +zone=18 +south +datum=WGS84 +units=m +no_defs',
        name: 'WGS84 / UTM Zone 18S',
        description: 'UTM Zona 18 Sur - Ecuador Continental Oriental',
        units: 'meters',
        region: 'Ecuador Oriental',
        zone: 18,
        hemisphere: 'S'
    },
    
    // Sistema para Islas Galápagos
    GALAPAGOS_UTM_15S: {
        epsg: 'EPSG:32715',
        proj4: '+proj=utm +zone=15 +south +datum=WGS84 +units=m +no_defs',
        name: 'WGS84 / UTM Zone 15S',
        description: 'UTM Zona 15 Sur - Islas Galápagos',
        units: 'meters',
        region: 'Galápagos',
        zone: 15,
        hemisphere: 'S'
    },
    
    // Sistema PSAD56 (histórico/legacy)
    PSAD56_17S: {
        epsg: 'EPSG:24817',
        proj4: '+proj=utm +zone=17 +south +ellps=intl +towgs84=-307,53,-318,0,0,0,0 +units=m +no_defs',
        name: 'PSAD56 / UTM Zone 17S',
        description: 'PSAD56 UTM Zona 17 Sur - Sistema Histórico Ecuador',
        units: 'meters',
        region: 'Ecuador (Histórico)',
        zone: 17,
        hemisphere: 'S',
        deprecated: true
    },
    
    PSAD56_18S: {
        epsg: 'EPSG:24818',
        proj4: '+proj=utm +zone=18 +south +ellps=intl +towgs84=-307,53,-318,0,0,0,0 +units=m +no_defs',
        name: 'PSAD56 / UTM Zone 18S',
        description: 'PSAD56 UTM Zona 18 Sur - Sistema Histórico Ecuador',
        units: 'meters',
        region: 'Ecuador (Histórico)',
        zone: 18,
        hemisphere: 'S',
        deprecated: true
    }
};

// Sistemas de coordenadas para países vecinos (regional)
const CRS_REGIONAL = {
    // Colombia
    COLOMBIA_MAGNA_SIRGAS_3116: {
        epsg: 'EPSG:3116',
        proj4: '+proj=tmerc +lat_0=4.596200416666666 +lon_0=-74.07750791666666 +k=1 +x_0=1000000 +y_0=1000000 +ellps=GRS80 +towgs84=0,0,0,0,0,0,0 +units=m +no_defs',
        name: 'MAGNA-SIRGAS / Colombia Bogotá zone',
        description: 'Sistema Nacional Colombia - Zona Bogotá',
        units: 'meters',
        region: 'Colombia'
    },
    
    // Perú
    PERU_UTM_17S: {
        epsg: 'EPSG:32717',
        proj4: '+proj=utm +zone=17 +south +datum=WGS84 +units=m +no_defs',
        name: 'WGS84 / UTM Zone 17S',
        description: 'UTM Zona 17 Sur - Perú Occidental',
        units: 'meters',
        region: 'Perú'
    },
    
    PERU_UTM_18S: {
        epsg: 'EPSG:32718',
        proj4: '+proj=utm +zone=18 +south +datum=WGS84 +units=m +no_defs',
        name: 'WGS84 / UTM Zone 18S',
        description: 'UTM Zona 18 Sur - Perú Central',
        units: 'meters',
        region: 'Perú'
    },
    
    PERU_UTM_19S: {
        epsg: 'EPSG:32719',
        proj4: '+proj=utm +zone=19 +south +datum=WGS84 +units=m +no_defs',
        name: 'WGS84 / UTM Zone 19S',
        description: 'UTM Zona 19 Sur - Perú Oriental',
        units: 'meters',
        region: 'Perú'
    }
};

// Configuración de precisión por tipo de coordenada
const PRECISION_CONFIG = {
    geographic: {
        decimal: 6,  // 6 decimales para coordenadas geográficas (~11cm de precisión)
        display: 6
    },
    projected: {
        decimal: 2,  // 2 decimales para coordenadas proyectadas (cm)
        display: 2
    },
    dms: {
        seconds: 2   // 2 decimales para segundos en DMS
    }
};

/**
 * Clase principal para manejo de proyecciones
 */
class ProjectionManager {
    constructor() {
        this.crs = { ...CRS_ECUADOR, ...CRS_REGIONAL };
        this.precision = PRECISION_CONFIG;
        this.defaultCRS = 'WGS84';
        this.primaryRegion = 'Ecuador';
    }
    
    /**
     * Obtener CRS por código EPSG
     */
    getCRSByEPSG(epsgCode) {
        const found = Object.values(this.crs).find(crs => crs.epsg === epsgCode);
        if (!found) {
            throw new Error(`CRS no encontrado para EPSG: ${epsgCode}`);
        }
        return found;
    }
    
    /**
     * Obtener CRS recomendado para una ubicación específica
     */
    getRecommendedCRS(lat, lng) {
        // Lógica específica para Ecuador y región
        if (this.isInEcuador(lat, lng)) {
            if (this.isInGalapagos(lat, lng)) {
                return this.crs.GALAPAGOS_UTM_15S;
            } else if (lng < -78.5) {
                return this.crs.UTM_17S;  // Ecuador Occidental
            } else {
                return this.crs.UTM_18S;  // Ecuador Oriental
            }
        }
        
        // Para otras ubicaciones, usar UTM automático
        return this.getUTMZone(lat, lng);
    }
    
    /**
     * Verificar si una coordenada está en Ecuador
     */
    isInEcuador(lat, lng) {
        return (lat >= -5.0 && lat <= 1.5 && lng >= -81.5 && lng <= -75.0);
    }
    
    /**
     * Verificar si una coordenada está en Galápagos
     */
    isInGalapagos(lat, lng) {
        return (lat >= -1.5 && lat <= 0.7 && lng >= -92.0 && lng <= -89.0);
    }
    
    /**
     * Obtener zona UTM automática para cualquier coordenada
     */
    getUTMZone(lat, lng) {
        const zone = Math.floor((lng + 180) / 6) + 1;
        const hemisphere = lat >= 0 ? 'N' : 'S';
        const epsgBase = lat >= 0 ? 32600 : 32700;
        const epsgCode = `EPSG:${epsgBase + zone}`;
        
        return {
            epsg: epsgCode,
            proj4: `+proj=utm +zone=${zone} ${hemisphere === 'S' ? '+south' : ''} +datum=WGS84 +units=m +no_defs`,
            name: `WGS84 / UTM Zone ${zone}${hemisphere}`,
            description: `UTM Zona ${zone} ${hemisphere === 'S' ? 'Sur' : 'Norte'}`,
            units: 'meters',
            region: 'Automático',
            zone: zone,
            hemisphere: hemisphere
        };
    }
    
    /**
     * Convertir coordenadas entre sistemas
     */
    transform(coords, fromCRS, toCRS) {
        try {
            const from = typeof fromCRS === 'string' ? this.getCRSByEPSG(fromCRS) : fromCRS;
            const to = typeof toCRS === 'string' ? this.getCRSByEPSG(toCRS) : toCRS;
            
            const result = proj4(from.proj4, to.proj4, coords);
            
            // Aplicar precisión según el tipo de coordenadas de destino
            const precision = to.units === 'degrees' ? 
                this.precision.geographic.decimal : 
                this.precision.projected.decimal;
            
            return [
                Number(result[0].toFixed(precision)),
                Number(result[1].toFixed(precision))
            ];
        } catch (error) {
            throw new Error(`Error en transformación: ${error.message}`);
        }
    }
    
    /**
     * Convertir coordenadas geográficas a UTM (mejorado)
     */
    toUTM(lat, lng, forceCRS = null) {
        const crs = forceCRS || this.getRecommendedCRS(lat, lng);
        const coords = this.transform([lng, lat], this.crs.WGS84, crs);
        
        return {
            easting: coords[0],
            northing: coords[1],
            zone: crs.zone || this.extractZoneFromEPSG(crs.epsg),
            hemisphere: crs.hemisphere || (lat >= 0 ? 'N' : 'S'),
            zoneString: `${crs.zone || this.extractZoneFromEPSG(crs.epsg)}${crs.hemisphere || (lat >= 0 ? 'N' : 'S')}`,
            epsg: crs.epsg,
            crs: crs
        };
    }
    
    /**
     * Convertir coordenadas UTM a geográficas (mejorado)
     */
    fromUTM(easting, northing, zone, hemisphere, datum = 'WGS84') {
        const epsgCode = `EPSG:${hemisphere === 'N' ? 32600 + zone : 32700 + zone}`;
        const utmCRS = this.getCRSByEPSG(epsgCode);
        const coords = this.transform([easting, northing], utmCRS, this.crs.WGS84);
        
        return {
            lat: coords[1],
            lng: coords[0],
            precision: this.precision.geographic.decimal
        };
    }
    
    /**
     * Extraer número de zona de código EPSG
     */
    extractZoneFromEPSG(epsgCode) {
        const code = parseInt(epsgCode.replace('EPSG:', ''));
        if (code >= 32601 && code <= 32660) return code - 32600; // Norte
        if (code >= 32701 && code <= 32760) return code - 32700; // Sur
        return null;
    }
    
    /**
     * Obtener lista de CRS disponibles para una región
     */
    getCRSForRegion(region = 'Ecuador') {
        return Object.entries(this.crs)
            .filter(([key, crs]) => crs.region.includes(region))
            .map(([key, crs]) => ({ key, ...crs }));
    }
    
    /**
     * Validar coordenadas según el sistema
     */
    validateCoordinates(coords, crsType) {
        const [x, y] = coords;
        
        if (crsType.units === 'degrees') {
            if (x < -180 || x > 180) throw new Error(`Longitud fuera de rango: ${x}`);
            if (y < -90 || y > 90) throw new Error(`Latitud fuera de rango: ${y}`);
        } else if (crsType.units === 'meters') {
            if (Math.abs(x) > 1000000) throw new Error(`Coordenada X fuera de rango: ${x}`);
            if (Math.abs(y) > 10000000) throw new Error(`Coordenada Y fuera de rango: ${y}`);
        }
        
        return true;
    }
}

// Instancia global del gestor de proyecciones
const projectionManager = new ProjectionManager();

/**
 * FUNCIONES DE COMPATIBILIDAD - Mantienen la API existente
 */

// Función mejorada que reemplaza la existente
const convertirLatLngAutm = (lat, lng) => {
    try {
        const result = projectionManager.toUTM(lat, lng);
        return {
            easting: result.easting.toFixed(2),
            northing: result.northing.toFixed(2),
            zone: result.zoneString,
            epsg: result.epsg
        };
    } catch (error) {
        console.error('Error en conversión UTM:', error);
        // Fallback a la función original si hay error
        const zona = Math.floor((lng + 180) / 6) + 1;
        const hemisferio = lat >= 0 ? "N" : "S";
        const epsgCode = lat >= 0 ? `EPSG:326${zona}` : `EPSG:327${zona}`;
        const projDef = `+proj=utm +zone=${zona} ${hemisferio === "S" ? "+south" : ""} +datum=WGS84 +units=m +no_defs`;
        const utmCoords = proj4(projDef, [lng, lat]);
        
        return {
            easting: utmCoords[0].toFixed(2),
            northing: utmCoords[1].toFixed(2),
            zone: `${zona}${hemisferio}`,
            epsg: epsgCode
        };
    }
};

/**
 * NUEVAS FUNCIONES AVANZADAS
 */

// Convertir entre sistemas específicos de Ecuador
const convertirEntreEcuador = (coords, fromSystem, toSystem) => {
    const from = projectionManager.crs[fromSystem];
    const to = projectionManager.crs[toSystem];
    
    if (!from || !to) {
        throw new Error('Sistema de coordenadas no válido para Ecuador');
    }
    
    return projectionManager.transform(coords, from, to);
};

// Obtener el mejor CRS para una región específica
const obtenerMejorCRS = (lat, lng) => {
    return projectionManager.getRecommendedCRS(lat, lng);
};

// Validar si coordenadas están en Ecuador
const estaEnEcuador = (lat, lng) => {
    return projectionManager.isInEcuador(lat, lng);
};

// Obtener información detallada de zona UTM
const obtenerInfoZonaUTM = (lat, lng) => {
    const crs = projectionManager.getRecommendedCRS(lat, lng);
    const utm = projectionManager.toUTM(lat, lng);
    
    return {
        ...utm,
        info: crs,
        esEcuador: projectionManager.isInEcuador(lat, lng),
        esGalapagos: projectionManager.isInGalapagos(lat, lng),
        recomendacion: crs.description
    };
};

// Exportar funciones y objetos principales
window.ProjectionManager = ProjectionManager;
window.projectionManager = projectionManager;
window.CRS_ECUADOR = CRS_ECUADOR;
window.CRS_REGIONAL = CRS_REGIONAL;

// Funciones de compatibilidad (mantienen API existente)
window.convertirLatLngAutm = convertirLatLngAutm;

// Nuevas funciones avanzadas
window.convertirEntreEcuador = convertirEntreEcuador;
window.obtenerMejorCRS = obtenerMejorCRS;
window.estaEnEcuador = estaEnEcuador;
window.obtenerInfoZonaUTM = obtenerInfoZonaUTM;

console.log('✅ Sistema de proyecciones regionales inicializado');
console.log('📍 Sistemas disponibles para Ecuador:', Object.keys(CRS_ECUADOR));
console.log('🌎 Sistemas regionales disponibles:', Object.keys(CRS_REGIONAL));