import React, { useEffect } from 'react'
import { MapContainer, TileLayer, Marker, Popup, GeoJSON, useMap } from 'react-leaflet'
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'

// Fix for default marker icons in webpack/vite
delete (L.Icon.Default.prototype as any)._getIconUrl
L.Icon.Default.mergeOptions({
	iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png',
	iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png',
	shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png',
})

// Custom dam icon
const damIcon = new L.DivIcon({
	className: 'dam-marker',
	html: `<div style="
		background: linear-gradient(135deg, #0070d6 0%, #00bcd4 100%);
		width: 32px;
		height: 32px;
		border-radius: 50% 50% 50% 0;
		transform: rotate(-45deg);
		display: flex;
		align-items: center;
		justify-content: center;
		box-shadow: 0 3px 10px rgba(0,0,0,0.3);
		border: 2px solid white;
	">
		<span style="transform: rotate(45deg); font-size: 14px;">💧</span>
	</div>`,
	iconSize: [32, 32],
	iconAnchor: [16, 32],
	popupAnchor: [0, -32],
})

// Yatırım Önerileri - DSS tarafından hesaplanmış
export const investmentRecommendations = [
	// Şebeke Yenileme Önerileri (Yüksek kayıp bölgeleri)
	{
		type: 'network' as const,
		name: 'Buca Şebeke Yenileme',
		lat: 38.385,
		lng: 27.18,
		district: 'Buca',
		priority: 'high' as const,
		reason: 'Yüksek nüfus yoğunluğu, eski altyapı, yüksek kayıp oranı',
		estimatedCost: '45 milyon ₺',
		estimatedSaving: '8.5 milyon m³/yıl',
		description: 'Ana hatların yenilenmesi ve basınç düzenleyici vana kurulumu'
	},
	{
		type: 'network' as const,
		name: 'Konak Merkez Şebeke',
		lat: 38.425,
		lng: 27.14,
		district: 'Konak',
		priority: 'high' as const,
		reason: 'En eski şebeke altyapısı, %35+ kayıp oranı',
		estimatedCost: '62 milyon ₺',
		estimatedSaving: '12 milyon m³/yıl',
		description: 'Tarihi bölge şebeke modernizasyonu'
	},
	{
		type: 'network' as const,
		name: 'Karşıyaka Sahil Hattı',
		lat: 38.47,
		lng: 27.10,
		district: 'Karşıyaka',
		priority: 'medium' as const,
		reason: 'Deniz seviyesi korozyonu, orta düzey kayıp',
		estimatedCost: '28 milyon ₺',
		estimatedSaving: '4.2 milyon m³/yıl',
		description: 'Sahil kesimi boru hattı yenileme'
	},

	// Yeni Su Deposu Önerileri (Büyüyen bölgeler)
	{
		type: 'reservoir' as const,
		name: 'Çiğli Yeni Depo',
		lat: 38.52,
		lng: 26.95,
		district: 'Çiğli',
		priority: 'high' as const,
		reason: 'Hızlı kentleşme, yetersiz depolama kapasitesi',
		estimatedCost: '35 milyon ₺',
		capacity: '50,000 m³',
		description: 'Yeni yerleşim alanları için terfi merkezi ve depo'
	},
	{
		type: 'reservoir' as const,
		name: 'Torbalı Sanayi Deposu',
		lat: 38.25,
		lng: 27.40,
		district: 'Torbalı',
		priority: 'high' as const,
		reason: 'Sanayi bölgesi genişlemesi, artan talep',
		estimatedCost: '42 milyon ₺',
		capacity: '75,000 m³',
		description: 'OSB ve yeni sanayi tesisleri için büyük kapasiteli depo'
	},
	{
		type: 'reservoir' as const,
		name: 'Kemalpaşa Depo',
		lat: 38.45,
		lng: 27.42,
		district: 'Kemalpaşa',
		priority: 'medium' as const,
		reason: 'Lojistik merkez gelişimi, nüfus artışı',
		estimatedCost: '28 milyon ₺',
		capacity: '40,000 m³',
		description: 'Yüksek kotlu yerleşimler için basınç dengeleme deposu'
	},
	{
		type: 'reservoir' as const,
		name: 'Menderes Kuzey Deposu',
		lat: 38.28,
		lng: 27.12,
		district: 'Menderes',
		priority: 'medium' as const,
		reason: 'Tahtalı Barajı yakınlığı, dağıtım optimizasyonu',
		estimatedCost: '22 milyon ₺',
		capacity: '30,000 m³',
		description: 'Baraj çıkış suyu tamponlama deposu'
	},

	// Yeni Boru Hattı Önerileri
	{
		type: 'pipeline' as const,
		name: 'Çeşme-Urla İletim Hattı',
		lat: 38.35,
		lng: 26.60,
		district: 'Çeşme/Urla',
		priority: 'high' as const,
		reason: 'Turizm sezonu pik talebi, mevcut hat yetersiz',
		estimatedCost: '85 milyon ₺',
		length: '25 km',
		description: 'DN800 yeni iletim hattı, kapasite 3x artış'
	},
	{
		type: 'pipeline' as const,
		name: 'Bergama-Dikili Bağlantısı',
		lat: 39.00,
		lng: 26.95,
		district: 'Bergama/Dikili',
		priority: 'medium' as const,
		reason: 'Kuzey ilçelerin Gördes hattına bağlanması',
		estimatedCost: '55 milyon ₺',
		length: '18 km',
		description: 'DN600 bağlantı hattı, sistem yedekliliği'
	},
	{
		type: 'pipeline' as const,
		name: 'Aliağa Sanayi Hattı',
		lat: 38.80,
		lng: 27.02,
		district: 'Aliağa',
		priority: 'medium' as const,
		reason: 'Petrokimya ve tersane bölgesi genişlemesi',
		estimatedCost: '48 milyon ₺',
		length: '12 km',
		description: 'Endüstriyel kalite su iletim hattı'
	},

	// Potansiyel Yeni Baraj/Gölet Yerleri
	{
		type: 'dam' as const,
		name: 'Bayındır Göleti',
		lat: 38.32,
		lng: 27.68,
		district: 'Bayındır',
		priority: 'low' as const,
		reason: 'Doğal vadi yapısı, yağış havzası potansiyeli',
		estimatedCost: '180 milyon ₺',
		capacity: '25 milyon m³',
		description: 'Orta ölçekli gölet, tarımsal ve kentsel kullanım'
	},
	{
		type: 'dam' as const,
		name: 'Kiraz Barajı Projesi',
		lat: 38.28,
		lng: 28.25,
		district: 'Kiraz',
		priority: 'low' as const,
		reason: 'Küçük Menderes havzası, yüksek yağış potansiyeli',
		estimatedCost: '320 milyon ₺',
		capacity: '85 milyon m³',
		description: 'Uzun vadeli kapasite artışı, HES potansiyeli'
	},
]

// İzmir Barajları
export const izmirDams = [
	{
		name: 'Tahtalı Barajı',
		lat: 38.1833,
		lng: 27.0833,
		district: 'Menderes',
		capacity: '176 milyon m³',
	},
	{
		name: 'Balçova Barajı',
		lat: 38.3833,
		lng: 27.0167,
		district: 'Balçova',
		capacity: '8.5 milyon m³',
	},
	{
		name: 'Ürkmez Barajı',
		lat: 38.1167,
		lng: 26.9500,
		district: 'Seferihisar',
		capacity: '25 milyon m³',
	},
	{
		name: 'Güzelhisar Barajı',
		lat: 38.4500,
		lng: 27.2167,
		district: 'Menemen',
		capacity: '130 milyon m³',
	},
	{
		name: 'Gördes Barajı',
		lat: 38.9333,
		lng: 28.3000,
		district: 'Gördes (Manisa)',
		capacity: '450 milyon m³',
	},
	{
		name: 'Alaçatı Kutlu Aktaş Barajı',
		lat: 38.2833,
		lng: 26.3833,
		district: 'Çeşme',
		capacity: '8 milyon m³',
	},
]

// İzmir İlçe Sınırları GeoJSON (Basitleştirilmiş)
export const izmirDistrictsGeoJSON: GeoJSON.FeatureCollection = {
	type: 'FeatureCollection',
	features: [
		{
			type: 'Feature',
			properties: { name: 'Konak', population: 390000 },
			geometry: {
				type: 'Polygon',
				coordinates: [[[27.10, 38.40], [27.18, 38.40], [27.18, 38.45], [27.10, 38.45], [27.10, 38.40]]]
			}
		},
		{
			type: 'Feature',
			properties: { name: 'Karşıyaka', population: 340000 },
			geometry: {
				type: 'Polygon',
				coordinates: [[[27.08, 38.45], [27.18, 38.45], [27.18, 38.50], [27.08, 38.50], [27.08, 38.45]]]
			}
		},
		{
			type: 'Feature',
			properties: { name: 'Bornova', population: 450000 },
			geometry: {
				type: 'Polygon',
				coordinates: [[[27.18, 38.42], [27.30, 38.42], [27.30, 38.52], [27.18, 38.52], [27.18, 38.42]]]
			}
		},
		{
			type: 'Feature',
			properties: { name: 'Buca', population: 520000 },
			geometry: {
				type: 'Polygon',
				coordinates: [[[27.12, 38.35], [27.25, 38.35], [27.25, 38.42], [27.12, 38.42], [27.12, 38.35]]]
			}
		},
		{
			type: 'Feature',
			properties: { name: 'Çiğli', population: 210000 },
			geometry: {
				type: 'Polygon',
				coordinates: [[[26.85, 38.48], [27.08, 38.48], [27.08, 38.55], [26.85, 38.55], [26.85, 38.48]]]
			}
		},
		{
			type: 'Feature',
			properties: { name: 'Gaziemir', population: 140000 },
			geometry: {
				type: 'Polygon',
				coordinates: [[[27.05, 38.30], [27.15, 38.30], [27.15, 38.36], [27.05, 38.36], [27.05, 38.30]]]
			}
		},
		{
			type: 'Feature',
			properties: { name: 'Balçova', population: 80000 },
			geometry: {
				type: 'Polygon',
				coordinates: [[[27.00, 38.37], [27.10, 38.37], [27.10, 38.42], [27.00, 38.42], [27.00, 38.37]]]
			}
		},
		{
			type: 'Feature',
			properties: { name: 'Narlıdere', population: 70000 },
			geometry: {
				type: 'Polygon',
				coordinates: [[[26.92, 38.37], [27.02, 38.37], [27.02, 38.42], [26.92, 38.42], [26.92, 38.37]]]
			}
		},
		{
			type: 'Feature',
			properties: { name: 'Güzelbahçe', population: 35000 },
			geometry: {
				type: 'Polygon',
				coordinates: [[[26.85, 38.35], [26.95, 38.35], [26.95, 38.40], [26.85, 38.40], [26.85, 38.35]]]
			}
		},
		{
			type: 'Feature',
			properties: { name: 'Urla', population: 70000 },
			geometry: {
				type: 'Polygon',
				coordinates: [[[26.65, 38.30], [26.85, 38.30], [26.85, 38.42], [26.65, 38.42], [26.65, 38.30]]]
			}
		},
		{
			type: 'Feature',
			properties: { name: 'Seferihisar', population: 50000 },
			geometry: {
				type: 'Polygon',
				coordinates: [[[26.80, 38.08], [27.00, 38.08], [27.00, 38.25], [26.80, 38.25], [26.80, 38.08]]]
			}
		},
		{
			type: 'Feature',
			properties: { name: 'Çeşme', population: 45000 },
			geometry: {
				type: 'Polygon',
				coordinates: [[[26.25, 38.25], [26.55, 38.25], [26.55, 38.42], [26.25, 38.42], [26.25, 38.25]]]
			}
		},
		{
			type: 'Feature',
			properties: { name: 'Karaburun', population: 12000 },
			geometry: {
				type: 'Polygon',
				coordinates: [[[26.35, 38.42], [26.65, 38.42], [26.65, 38.70], [26.35, 38.70], [26.35, 38.42]]]
			}
		},
		{
			type: 'Feature',
			properties: { name: 'Foça', population: 35000 },
			geometry: {
				type: 'Polygon',
				coordinates: [[[26.65, 38.58], [26.90, 38.58], [26.90, 38.78], [26.65, 38.78], [26.65, 38.58]]]
			}
		},
		{
			type: 'Feature',
			properties: { name: 'Menemen', population: 180000 },
			geometry: {
				type: 'Polygon',
				coordinates: [[[26.90, 38.55], [27.20, 38.55], [27.20, 38.72], [26.90, 38.72], [26.90, 38.55]]]
			}
		},
		{
			type: 'Feature',
			properties: { name: 'Aliağa', population: 100000 },
			geometry: {
				type: 'Polygon',
				coordinates: [[[26.88, 38.72], [27.15, 38.72], [27.15, 38.88], [26.88, 38.88], [26.88, 38.72]]]
			}
		},
		{
			type: 'Feature',
			properties: { name: 'Dikili', population: 45000 },
			geometry: {
				type: 'Polygon',
				coordinates: [[[26.75, 38.88], [27.05, 38.88], [27.05, 39.15], [26.75, 39.15], [26.75, 38.88]]]
			}
		},
		{
			type: 'Feature',
			properties: { name: 'Bergama', population: 105000 },
			geometry: {
				type: 'Polygon',
				coordinates: [[[27.05, 38.88], [27.45, 38.88], [27.45, 39.20], [27.05, 39.20], [27.05, 38.88]]]
			}
		},
		{
			type: 'Feature',
			properties: { name: 'Kınık', population: 30000 },
			geometry: {
				type: 'Polygon',
				coordinates: [[[27.30, 38.95], [27.55, 38.95], [27.55, 39.15], [27.30, 39.15], [27.30, 38.95]]]
			}
		},
		{
			type: 'Feature',
			properties: { name: 'Kemalpaşa', population: 110000 },
			geometry: {
				type: 'Polygon',
				coordinates: [[[27.30, 38.35], [27.55, 38.35], [27.55, 38.55], [27.30, 38.55], [27.30, 38.35]]]
			}
		},
		{
			type: 'Feature',
			properties: { name: 'Torbalı', population: 190000 },
			geometry: {
				type: 'Polygon',
				coordinates: [[[27.25, 38.12], [27.55, 38.12], [27.55, 38.35], [27.25, 38.35], [27.25, 38.12]]]
			}
		},
		{
			type: 'Feature',
			properties: { name: 'Menderes', population: 95000 },
			geometry: {
				type: 'Polygon',
				coordinates: [[[27.00, 38.12], [27.25, 38.12], [27.25, 38.32], [27.00, 38.32], [27.00, 38.12]]]
			}
		},
		{
			type: 'Feature',
			properties: { name: 'Selçuk', population: 38000 },
			geometry: {
				type: 'Polygon',
				coordinates: [[[27.25, 37.90], [27.50, 37.90], [27.50, 38.12], [27.25, 38.12], [27.25, 37.90]]]
			}
		},
		{
			type: 'Feature',
			properties: { name: 'Tire', population: 90000 },
			geometry: {
				type: 'Polygon',
				coordinates: [[[27.55, 37.95], [27.90, 37.95], [27.90, 38.20], [27.55, 38.20], [27.55, 37.95]]]
			}
		},
		{
			type: 'Feature',
			properties: { name: 'Ödemiş', population: 135000 },
			geometry: {
				type: 'Polygon',
				coordinates: [[[27.85, 38.00], [28.20, 38.00], [28.20, 38.30], [27.85, 38.30], [27.85, 38.00]]]
			}
		},
		{
			type: 'Feature',
			properties: { name: 'Bayındır', population: 45000 },
			geometry: {
				type: 'Polygon',
				coordinates: [[[27.55, 38.20], [27.85, 38.20], [27.85, 38.40], [27.55, 38.40], [27.55, 38.20]]]
			}
		},
		{
			type: 'Feature',
			properties: { name: 'Kiraz', population: 45000 },
			geometry: {
				type: 'Polygon',
				coordinates: [[[28.10, 38.15], [28.40, 38.15], [28.40, 38.40], [28.10, 38.40], [28.10, 38.15]]]
			}
		},
		{
			type: 'Feature',
			properties: { name: 'Beydağ', population: 15000 },
			geometry: {
				type: 'Polygon',
				coordinates: [[[28.15, 38.00], [28.35, 38.00], [28.35, 38.15], [28.15, 38.15], [28.15, 38.00]]]
			}
		},
	]
}

// Style function for districts
const getDistrictStyle = (feature: any) => {
	const colors = [
		'#0070d6', '#00bcd4', '#10b981', '#8b5cf6', '#f59e0b', '#f43f5e',
		'#06b6d4', '#14b8a6', '#a855f7', '#eab308', '#ec4899', '#3b82f6',
		'#059669', '#7c3aed', '#d97706', '#e11d48', '#0891b2', '#0d9488'
	]
	const index = izmirDistrictsGeoJSON.features.indexOf(feature)
	return {
		fillColor: colors[index % colors.length],
		weight: 2,
		opacity: 1,
		color: 'white',
		fillOpacity: 0.35,
	}
}

interface ReservoirData {
	name: string
	fill: number
}

interface IzmirMapProps {
	reservoirData?: ReservoirData[]
	showInvestments?: boolean
}

// Investment type icons and colors
const investmentStyles = {
	network: { icon: '🔧', color: '#f59e0b', label: 'Şebeke Yenileme' },
	reservoir: { icon: '🏗️', color: '#8b5cf6', label: 'Yeni Su Deposu' },
	pipeline: { icon: '🚰', color: '#0070d6', label: 'Boru Hattı' },
	dam: { icon: '💧', color: '#10b981', label: 'Baraj/Gölet' },
}

const priorityColors = {
	high: '#dc2626',
	medium: '#f59e0b', 
	low: '#22c55e',
}

// Map bounds fitter component
function FitBounds() {
	const map = useMap()
	useEffect(() => {
		// Fit to İzmir bounds
		map.fitBounds([
			[37.85, 26.20],
			[39.25, 28.50]
		])
	}, [map])
	return null
}

export function IzmirMap({ reservoirData = [], showInvestments = false }: IzmirMapProps) {
	// Get fill percentage for a dam
	const getDamFill = (damName: string): number | null => {
		const match = reservoirData.find(r => 
			r.name.toLowerCase().includes(damName.toLowerCase().split(' ')[0]) ||
			damName.toLowerCase().includes(r.name.toLowerCase().split(' ')[0])
		)
		return match?.fill ?? null
	}

	const getFillColor = (fill: number | null): string => {
		if (fill === null) return '#6b7280'
		if (fill <= 20) return '#dc2626'
		if (fill <= 40) return '#f59e0b'
		return '#22c55e'
	}

	return (
		<div style={{ height: '100%', width: '100%', borderRadius: 12, overflow: 'hidden' }}>
			<MapContainer
				center={[38.42, 27.13]}
				zoom={8}
				style={{ height: '100%', width: '100%' }}
				scrollWheelZoom={true}
			>
				<FitBounds />
				<TileLayer
					attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
					url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
				/>
				
				{/* İlçe Sınırları */}
				<GeoJSON 
					data={izmirDistrictsGeoJSON} 
					style={getDistrictStyle}
					onEachFeature={(feature, layer) => {
						layer.bindPopup(`
							<div style="text-align: center; padding: 4px;">
								<strong style="font-size: 14px;">${feature.properties.name}</strong><br/>
								<span style="color: #666; font-size: 12px;">Nüfus: ~${(feature.properties.population / 1000).toFixed(0)}K</span>
							</div>
						`)
						layer.on({
							mouseover: (e) => {
								const target = e.target
								target.setStyle({
									fillOpacity: 0.7,
									weight: 3,
								})
							},
							mouseout: (e) => {
								const target = e.target
								target.setStyle({
									fillOpacity: 0.35,
									weight: 2,
								})
							}
						})
					}}
				/>

				{/* Baraj Noktaları */}
				{izmirDams.map((dam) => {
					const fill = getDamFill(dam.name)
					return (
						<Marker
							key={dam.name}
							position={[dam.lat, dam.lng]}
							icon={new L.DivIcon({
								className: 'dam-marker-custom',
								html: `<div style="
									background: ${getFillColor(fill)};
									width: 36px;
									height: 36px;
									border-radius: 50% 50% 50% 0;
									transform: rotate(-45deg);
									display: flex;
									align-items: center;
									justify-content: center;
									box-shadow: 0 3px 12px rgba(0,0,0,0.35);
									border: 3px solid white;
									cursor: pointer;
								">
									<span style="transform: rotate(45deg); font-size: 16px;">💧</span>
								</div>`,
								iconSize: [36, 36],
								iconAnchor: [18, 36],
								popupAnchor: [0, -36],
							})}
						>
							<Popup>
								<div style={{ minWidth: 180, padding: 4 }}>
									<h4 style={{ margin: '0 0 8px 0', color: '#1e293b', fontSize: 14 }}>{dam.name}</h4>
									<div style={{ display: 'flex', flexDirection: 'column', gap: 4, fontSize: 12 }}>
										<div><strong>İlçe:</strong> {dam.district}</div>
										<div><strong>Kapasite:</strong> {dam.capacity}</div>
										{fill !== null && (
											<div style={{ marginTop: 8 }}>
												<div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
													<strong>Doluluk:</strong>
													<span style={{ 
														color: getFillColor(fill),
														fontWeight: 700 
													}}>{fill.toFixed(1)}%</span>
												</div>
												<div style={{ 
													background: '#e5e7eb', 
													borderRadius: 4, 
													height: 8,
													overflow: 'hidden'
												}}>
													<div style={{
														width: `${Math.min(100, fill)}%`,
														height: '100%',
														background: getFillColor(fill),
														borderRadius: 4,
														transition: 'width 0.3s'
													}}></div>
												</div>
											</div>
										)}
									</div>
								</div>
							</Popup>
						</Marker>
					)
				})}

				{/* Yatırım Önerileri */}
				{showInvestments && investmentRecommendations.map((inv) => {
					const style = investmentStyles[inv.type]
					const priorityColor = priorityColors[inv.priority]
					
					return (
						<Marker
							key={inv.name}
							position={[inv.lat, inv.lng]}
							icon={new L.DivIcon({
								className: 'investment-marker',
								html: `<div style="
									position: relative;
								">
									<div style="
										background: ${style.color};
										width: 32px;
										height: 32px;
										border-radius: 8px;
										display: flex;
										align-items: center;
										justify-content: center;
										box-shadow: 0 3px 12px rgba(0,0,0,0.35);
										border: 3px solid white;
										cursor: pointer;
										font-size: 16px;
									">${style.icon}</div>
									<div style="
										position: absolute;
										top: -8px;
										right: -8px;
										width: 14px;
										height: 14px;
										background: ${priorityColor};
										border-radius: 50%;
										border: 2px solid white;
										box-shadow: 0 2px 4px rgba(0,0,0,0.3);
									"></div>
								</div>`,
								iconSize: [32, 32],
								iconAnchor: [16, 32],
								popupAnchor: [0, -32],
							})}
						>
							<Popup>
								<div style={{ minWidth: 240, padding: 4 }}>
									<div style={{ 
										display: 'flex', 
										alignItems: 'center', 
										gap: 8, 
										marginBottom: 10,
										paddingBottom: 8,
										borderBottom: `2px solid ${style.color}`
									}}>
										<span style={{ fontSize: 20 }}>{style.icon}</span>
										<div>
											<h4 style={{ margin: 0, color: '#1e293b', fontSize: 13 }}>{inv.name}</h4>
											<span style={{ 
												fontSize: 10, 
												background: style.color, 
												color: 'white', 
												padding: '2px 6px', 
												borderRadius: 4 
											}}>{style.label}</span>
										</div>
									</div>
									
									<div style={{ display: 'flex', flexDirection: 'column', gap: 6, fontSize: 11 }}>
										<div style={{ display: 'flex', justifyContent: 'space-between' }}>
											<strong>İlçe:</strong>
											<span>{inv.district}</span>
										</div>
										<div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
											<strong>Öncelik:</strong>
											<span style={{ 
												background: priorityColor, 
												color: 'white', 
												padding: '2px 8px', 
												borderRadius: 10,
												fontSize: 10,
												fontWeight: 600
											}}>
												{inv.priority === 'high' ? 'YÜKSEK' : inv.priority === 'medium' ? 'ORTA' : 'DÜŞÜK'}
											</span>
										</div>
										<div style={{ display: 'flex', justifyContent: 'space-between' }}>
											<strong>Tahmini Maliyet:</strong>
											<span style={{ color: '#7c3aed', fontWeight: 600 }}>{inv.estimatedCost}</span>
										</div>
										{(inv as any).estimatedSaving && (
											<div style={{ display: 'flex', justifyContent: 'space-between' }}>
												<strong>Tahmini Tasarruf:</strong>
												<span style={{ color: '#16a34a', fontWeight: 600 }}>{(inv as any).estimatedSaving}</span>
											</div>
										)}
										{(inv as any).capacity && (
											<div style={{ display: 'flex', justifyContent: 'space-between' }}>
												<strong>Kapasite:</strong>
												<span>{(inv as any).capacity}</span>
											</div>
										)}
										{(inv as any).length && (
											<div style={{ display: 'flex', justifyContent: 'space-between' }}>
												<strong>Uzunluk:</strong>
												<span>{(inv as any).length}</span>
											</div>
										)}
									</div>

									<div style={{ 
										marginTop: 10, 
										padding: 8, 
										background: '#f1f5f9', 
										borderRadius: 6,
										fontSize: 10
									}}>
										<div style={{ fontWeight: 600, color: '#475569', marginBottom: 4 }}>📋 Neden?</div>
										<div style={{ color: '#64748b' }}>{inv.reason}</div>
									</div>

									<div style={{ 
										marginTop: 8, 
										padding: 8, 
										background: '#eff6ff', 
										borderRadius: 6,
										fontSize: 10
									}}>
										<div style={{ fontWeight: 600, color: '#1e40af', marginBottom: 4 }}>📝 Açıklama</div>
										<div style={{ color: '#3b82f6' }}>{inv.description}</div>
									</div>
								</div>
							</Popup>
						</Marker>
					)
				})}
			</MapContainer>
		</div>
	)
}

export default IzmirMap

