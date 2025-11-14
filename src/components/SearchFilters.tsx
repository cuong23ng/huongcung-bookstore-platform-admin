import { useState } from "react";
import { X, ChevronDown, ChevronUp } from "lucide-react";
import { Button } from "./ui/button";
import { Label } from "./ui/label";
import { Separator } from "./ui/separator";
import { SearchFacet } from "@/models/Search";

interface SearchFiltersProps {
  facets: {
    [key: string]: SearchFacet[];
  };
  selectedGenres: string[];
  selectedLanguages: string[];
  selectedFormats: string[];
  selectedCities: string[];
  minPrice: number | undefined;
  maxPrice: number | undefined;
  onFilterChange: (filters: {
    genres?: string[];
    languages?: string[];
    formats?: string[];
    cities?: string[];
    minPrice?: number;
    maxPrice?: number;
  }) => void;
}

export const SearchFilters = ({
  facets,
  selectedGenres,
  selectedLanguages,
  selectedFormats,
  selectedCities,
  minPrice,
  maxPrice,
  onFilterChange,
}: SearchFiltersProps) => {
  const [expandedSections, setExpandedSections] = useState<{
    [key: string]: boolean;
  }>({
    genre: true,
    language: true,
    format: true,
    price: true,
    city: true,
  });

  const toggleSection = (section: string) => {
    setExpandedSections((prev) => ({
      ...prev,
      [section]: !prev[section],
    }));
  };

  const handleGenreToggle = (genre: string) => {
    const newGenres = selectedGenres.includes(genre)
      ? selectedGenres.filter((g) => g !== genre)
      : [...selectedGenres, genre];
    onFilterChange({ genres: newGenres });
  };

  const handleLanguageToggle = (language: string) => {
    const newLanguages = selectedLanguages.includes(language)
      ? selectedLanguages.filter((l) => l !== language)
      : [...selectedLanguages, language];
    onFilterChange({ languages: newLanguages });
  };

  const handleFormatToggle = (format: string) => {
    const newFormats = selectedFormats.includes(format)
      ? selectedFormats.filter((f) => f !== format)
      : [...selectedFormats, format];
    onFilterChange({ formats: newFormats });
  };

  const handleCityToggle = (city: string) => {
    const newCities = selectedCities.includes(city)
      ? selectedCities.filter((c) => c !== city)
      : [...selectedCities, city];
    onFilterChange({ cities: newCities });
  };

  const handlePriceChange = (type: "min" | "max", value: string) => {
    const numValue = value === "" ? undefined : Number(value);
    onFilterChange({
      minPrice: type === "min" ? numValue : minPrice,
      maxPrice: type === "max" ? numValue : maxPrice,
    });
  };

  const clearAllFilters = () => {
    onFilterChange({
      genres: [],
      languages: [],
      formats: [],
      cities: [],
      minPrice: undefined,
      maxPrice: undefined,
    });
  };

  const hasActiveFilters =
    selectedGenres.length > 0 ||
    selectedLanguages.length > 0 ||
    selectedFormats.length > 0 ||
    selectedCities.length > 0 ||
    minPrice !== undefined ||
    maxPrice !== undefined;

  const genreFacets = facets.genreNames || [];
  const languageFacets = facets.language || [];
  const formatFacets = facets.format || [];

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold">Bộ lọc</h3>
        {hasActiveFilters && (
          <Button
            variant="ghost"
            size="sm"
            onClick={clearAllFilters}
            className="text-xs"
          >
            <X className="h-4 w-4 mr-1" />
            Xóa tất cả
          </Button>
        )}
      </div>

      <Separator />

      {/* Genre Filter */}
      {genreFacets.length > 0 && (
        <div>
          <button
            onClick={() => toggleSection("genre")}
            className="flex items-center justify-between w-full mb-2"
            aria-expanded={expandedSections.genre}
          >
            <Label className="text-sm font-medium cursor-pointer">
              Thể loại
            </Label>
            {expandedSections.genre ? (
              <ChevronUp className="h-4 w-4" />
            ) : (
              <ChevronDown className="h-4 w-4" />
            )}
          </button>
          {expandedSections.genre && (
            <div className="space-y-2 max-h-60 overflow-y-auto">
              {genreFacets.map((facet) => (
                <label
                  key={facet.value}
                  className="flex items-center space-x-2 cursor-pointer hover:bg-accent p-2 rounded"
                >
                  <input
                    type="checkbox"
                    checked={selectedGenres.includes(facet.value)}
                    onChange={() => handleGenreToggle(facet.value)}
                    className="rounded"
                  />
                  <span className="text-sm flex-1">
                    {facet.value}
                  </span>
                  <span className="text-xs text-muted-foreground">
                    ({facet.count})
                  </span>
                </label>
              ))}
            </div>
          )}
        </div>
      )}

      <Separator />

      {/* Language Filter */}
      {languageFacets.length > 0 && (
        <div>
          <button
            onClick={() => toggleSection("language")}
            className="flex items-center justify-between w-full mb-2"
            aria-expanded={expandedSections.language}
          >
            <Label className="text-sm font-medium cursor-pointer">
              Ngôn ngữ
            </Label>
            {expandedSections.language ? (
              <ChevronUp className="h-4 w-4" />
            ) : (
              <ChevronDown className="h-4 w-4" />
            )}
          </button>
          {expandedSections.language && (
            <div className="space-y-2 max-h-60 overflow-y-auto">
              {languageFacets.map((facet) => (
                <label
                  key={facet.value}
                  className="flex items-center space-x-2 cursor-pointer hover:bg-accent p-2 rounded"
                >
                  <input
                    type="checkbox"
                    checked={selectedLanguages.includes(facet.value)}
                    onChange={() => handleLanguageToggle(facet.value)}
                    className="rounded"
                  />
                  <span className="text-sm flex-1">{facet.value}</span>
                  <span className="text-xs text-muted-foreground">
                    ({facet.count})
                  </span>
                </label>
              ))}
            </div>
          )}
        </div>
      )}

      <Separator />

      {/* Format Filter */}
      {formatFacets.length > 0 && (
        <div>
          <button
            onClick={() => toggleSection("format")}
            className="flex items-center justify-between w-full mb-2"
            aria-expanded={expandedSections.format}
          >
            <Label className="text-sm font-medium cursor-pointer">
              Định dạng
            </Label>
            {expandedSections.format ? (
              <ChevronUp className="h-4 w-4" />
            ) : (
              <ChevronDown className="h-4 w-4" />
            )}
          </button>
          {expandedSections.format && (
            <div className="space-y-2">
              {formatFacets.map((facet) => (
                <label
                  key={facet.value}
                  className="flex items-center space-x-2 cursor-pointer hover:bg-accent p-2 rounded"
                >
                  <input
                    type="checkbox"
                    checked={selectedFormats.includes(facet.value)}
                    onChange={() => handleFormatToggle(facet.value)}
                    className="rounded"
                  />
                  <span className="text-sm flex-1">
                    {facet.value === "PHYSICAL"
                      ? "Sách in"
                      : facet.value === "DIGITAL"
                      ? "Sách điện tử"
                      : facet.value === "BOTH"
                      ? "Cả hai"
                      : facet.value}
                  </span>
                  <span className="text-xs text-muted-foreground">
                    ({facet.count})
                  </span>
                </label>
              ))}
            </div>
          )}
        </div>
      )}

      <Separator />

      {/* Price Range Filter */}
      <div>
        <button
          onClick={() => toggleSection("price")}
          className="flex items-center justify-between w-full mb-2"
          aria-expanded={expandedSections.price}
        >
          <Label className="text-sm font-medium cursor-pointer">
            Khoảng giá
          </Label>
          {expandedSections.price ? (
            <ChevronUp className="h-4 w-4" />
          ) : (
            <ChevronDown className="h-4 w-4" />
          )}
        </button>
        {expandedSections.price && (
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <Label className="text-xs text-muted-foreground w-12">
                Từ:
              </Label>
              <input
                type="number"
                placeholder="0"
                value={minPrice ?? ""}
                onChange={(e) => handlePriceChange("min", e.target.value)}
                className="flex-1 px-3 py-1.5 text-sm border border-input rounded-md bg-background"
                min="0"
              />
              <span className="text-xs text-muted-foreground">₫</span>
            </div>
            <div className="flex items-center gap-2">
              <Label className="text-xs text-muted-foreground w-12">
                Đến:
              </Label>
              <input
                type="number"
                placeholder="Không giới hạn"
                value={maxPrice ?? ""}
                onChange={(e) => handlePriceChange("max", e.target.value)}
                className="flex-1 px-3 py-1.5 text-sm border border-input rounded-md bg-background"
                min="0"
              />
              <span className="text-xs text-muted-foreground">₫</span>
            </div>
          </div>
        )}
      </div>

      <Separator />

      {/* City Availability Filter */}
      <div>
        <button
          onClick={() => toggleSection("city")}
          className="flex items-center justify-between w-full mb-2"
          aria-expanded={expandedSections.city}
        >
          <Label className="text-sm font-medium cursor-pointer">
            Thành phố
          </Label>
          {expandedSections.city ? (
            <ChevronUp className="h-4 w-4" />
          ) : (
            <ChevronDown className="h-4 w-4" />
          )}
        </button>
        {expandedSections.city && (
          <div className="space-y-2">
            {["HANOI", "HCMC", "DANANG"].map((city) => {
              const cityName =
                city === "HANOI"
                  ? "Hà Nội"
                  : city === "HCMC"
                  ? "Hồ Chí Minh"
                  : "Đà Nẵng";
              return (
                <label
                  key={city}
                  className="flex items-center space-x-2 cursor-pointer hover:bg-accent p-2 rounded"
                >
                  <input
                    type="checkbox"
                    checked={selectedCities.includes(city)}
                    onChange={() => handleCityToggle(city)}
                    className="rounded"
                  />
                  <span className="text-sm">{cityName}</span>
                </label>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};

