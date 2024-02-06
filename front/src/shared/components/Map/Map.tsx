import MapView from "@arcgis/core/views/MapView";
import ArcGisMap from "@arcgis/core/Map";
import Graphic from "@arcgis/core/Graphic";
import GraphicsLayer from "@arcgis/core/layers/GraphicsLayer";
import {useEffect, useRef, useState} from "react";
import FeatureLayer from "@arcgis/core/layers/FeatureLayer";
import {useQuery} from "@tanstack/react-query";

const getRandomRgb = () => {
    const randomBetween = (min:number, max:number) => min + Math.floor(Math.random() * (max - min + 1));
    const r = randomBetween(0, 255);
    const g = randomBetween(0, 255);
    const b = randomBetween(0, 255);

    return [r,g,b]
}
const getPolygonFromString = (string: string) =>{
    return JSON.parse('[' + string.replaceAll('(', '[').replaceAll(')', ']') + ']');
}
const getPoints = (data: any[]) => {
    return data.map((el: any, index: number) => {
        // console.log(index);
        const point = { //Create a point
            type: "point",
            longitude: el.longitude,
            latitude: el.latitude
        };
        const simpleMarkerSymbol = {
            type: "simple-marker",
            color: 'blue',
            outline: {
                color: 'blue', // White
                width: 1
            }
        };
        const pointGraphic =  new Graphic({
            // @ts-ignore
            geometry: point,
            symbol: simpleMarkerSymbol
        });

        return pointGraphic
    })
}
const getPolygons = (data: any[]) => {
    return data.map((el) => {
        const polygon = {
            type: "polygon",
            rings: getPolygonFromString(el.geometry_coordinates),
        };
        // console.log(el.geometry_coordinates, polygon.rings)
        const simpleFillSymbol = {
            type: "simple-fill",
            color: [...getRandomRgb(), 0.5],  // Orange, opacity 80%
            outline: {
                color: getRandomRgb(),
                width: 1
            }
        };

        // console.log(simpleFillSymbol)

        const polygonGraphic = new Graphic({
            // @ts-ignore
            geometry: polygon,
            symbol: simpleFillSymbol,

        });

        return polygonGraphic;
    })
}

const SERVER_URL = 'http://localhost:5000'
// const SERVER_URL = 'https://arcgis-app-server.onrender.com'

export const Map = () => {
    const mapDiv = useRef(null);

    const [map, setMap] = useState<ArcGisMap | null>(null);
    const [view, setView] = useState<MapView | null>(null);

    const [populationFrom, setPopulationFrom] = useState('');
    const [populationTo, setPopulationTo] = useState('');
    const [dsciFrom, setDsciFrom] = useState('');
    const [dsciTo, setDsciTo] = useState('');

    const [showPoints, setShowPoints] = useState<boolean>(true);
    const [showPolygons, setShowPolygons] = useState<boolean>(false);

    const { data: dsciData } = useQuery({
        queryKey: ['min-max-dsci'],
        queryFn: () => {
            const url = new URL(`${SERVER_URL}/min-max-dsci`)

            return fetch(url).then((res) => res.json())
        },
    })

    const { data: populationData } = useQuery({
        queryKey: ['min-max-population'],
        queryFn: () => {
            const url = new URL(`${SERVER_URL}/min-max-population`)

            return fetch(url).then((res) => res.json())
        },
    })
    console.log(dsciData, populationData);

    const { isLoading: isPolygonsPending, refetch: refetchPolygons, isRefetching: isPolygonsRefetching } = useQuery({
        queryKey: ['polygons'],
        queryFn: () => {
            const polygonsUrl = new URL(`${SERVER_URL}/polygons`)

            let polygonsParams: any = {};
            if (dsciFrom){
                polygonsParams.dsciFrom = dsciFrom;
            }
            if (dsciTo){
                polygonsParams.dsciTo = dsciTo;
            }
            if (populationFrom){
                polygonsParams.populationFrom = populationFrom;
            }
            if (populationFrom){
                polygonsParams.populationTo = populationTo;
            }
            polygonsUrl.search = new URLSearchParams(polygonsParams).toString();

            fetch(polygonsUrl)
                .then((res) => res.json())
                .then((data) => {
                    const polygons = getPolygons(data);

                    view?.graphics.addMany(polygons, 10)
                })
        },
        enabled: !!map?.initialized && showPolygons,
    })

    const { isLoading: isPointsPending, refetch: refetchPoints, isRefetching: isPointsRefetching } = useQuery({
        queryKey: ['points'],
        queryFn: () => {
            const pointsUrl = new URL(`${SERVER_URL}/points`)

            let pointsParams: any = {};
            if (dsciFrom){
                pointsParams.dsciFrom = dsciFrom;
            }
            if (dsciTo){
                pointsParams.dsciTo = dsciTo;
            }
            if (populationFrom){
                pointsParams.populationFrom = populationFrom;
            }
            if (populationFrom){
                pointsParams.populationTo = populationTo;
            }
            pointsUrl.search = new URLSearchParams(pointsParams).toString();

            fetch(pointsUrl)
                .then((res) => res.json())
                .then((data) => {
                    const points = getPoints(data)
                    const pointsLayer = new FeatureLayer({
                        source: points,
                        objectIdField: 'points-layer'
                    })
                    map?.add(pointsLayer, 100000);

                })
        },
        enabled: !!map?.initialized && showPoints,
    })

    useEffect(() => {
        if (mapDiv.current) {
            const map = new ArcGisMap({
                basemap: "streets"
            });
            setMap(map);

            const view = new MapView({
                container: mapDiv.current || undefined, // The id or node representing the DOM element containing the view.
                map: map, // An instance of a Map object to display in the view.
                center: [-117.1490,32.7353],
                scale: 10000000 // Represents the map scale at the center of the view.
            });
            setView(view);

            return () => view && view.destroy()
        }
    }, []);

    useEffect(() => {
        if(!showPolygons) {
            view?.graphics.removeAll()
        }

        if (!showPoints) {
            map?.removeAll()
        }
    }, [showPolygons, showPoints]);

    const onFilterButtonClick = () => {
        map?.removeAll()
        view?.graphics.removeAll()

        if(showPolygons) {
            refetchPolygons()
        }

        if (showPoints) {
            refetchPoints()
        }
    }

    const isLoading = isPointsPending || isPointsRefetching || isPolygonsPending || isPolygonsRefetching;

    return <div style={{
        position: 'relative',
    }}>
        <div style={{
            position: 'fixed',
            top: 100,
            left: 10,
            width: 200,

            backgroundColor: 'teal',
            zIndex: 10,
            padding: 10,
            borderRadius: '5px',
            display: 'flex',
            flexDirection: 'column',
            gap: '10px',
        }}>
            Visibility
            <div>Lagoons <input type="checkbox" checked={showPoints} onChange={() => setShowPoints((prev)=> !prev)} /></div>
            <div>Drought <input type="checkbox" checked={showPolygons} onChange={() => setShowPolygons((prev)=> !prev)} /></div>
        </div>

        {(showPoints || showPolygons) && (<div style={{
            position: 'fixed',
            top: 250,
            width: 200,
            left: 10,
            backgroundColor: 'teal',
            zIndex: 10,
            padding: 10,
            borderRadius: '5px',
            display: 'flex',
            flexDirection: 'column',
            gap: '10px',
        }}>
            <div>Filters</div>
            {showPoints && (
                <>
                    Population {!!dsciData && (`(${dsciData.min} - ${dsciData.max})`)}
                    <input placeholder="from" type="number" value={populationFrom} onChange={(evt) => setPopulationFrom(evt.target.value)}/>
                    <input placeholder="to" type="number" value={populationTo} onChange={(evt) => setPopulationTo(evt.target.value)}/>
                </>
            )}

            {showPolygons && (
                <>
                    DSCI {!!populationData && (`(${populationData.min} - ${populationData.max})`)}
                    <input placeholder="from" type="number" value={dsciFrom} onChange={(evt) => setDsciFrom(evt.target.value)}/>
                    <input placeholder="to" type="number" value={dsciTo} onChange={(evt) => setDsciTo(evt.target.value)}/>
                </>
            )}
            <button disabled={isLoading} type="button" onClick={onFilterButtonClick}>{isLoading ? 'Loading' : 'Apply'}</button></div>)}
        <div className="mapDiv" ref={mapDiv} style={{height: '100vh', width: "100%"}}></div>
    </div>;
}
