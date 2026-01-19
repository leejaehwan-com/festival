import './RegionFilter.css';

const RegionFilter = ({ regions, selectedRegion, onRegionChange }) => {
  return (
    <div className="region-filter">
      <label htmlFor="region-select" className="filter-label">
        지역 선택:
      </label>
      <select
        id="region-select"
        className="region-select"
        value={selectedRegion}
        onChange={(e) => onRegionChange(e.target.value)}
      >
        <option value="">전체 지역</option>
        {regions.map((region) => (
          <option key={region} value={region}>
            {region}
          </option>
        ))}
      </select>
    </div>
  );
};

export default RegionFilter;
