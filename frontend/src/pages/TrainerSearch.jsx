import React, { useState, useEffect, useCallback } from 'react';
import { getTrainers } from '../lib/api';
import { Input } from '../components/ui/input';
import { Button } from '../components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/select';
import TrainerCard from '../components/TrainerCard';
import { Search, Filter, Users } from 'lucide-react';
import { CATEGORY_NAMES } from '../lib/utils';

const TrainerSearch = () => {
  const [trainers, setTrainers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({
    category: '',
    city: '',
  });

  const loadTrainers = useCallback(async () => {
    setLoading(true);
    try {
      const params = {};
      if (filters.category) params.category = filters.category;
      if (filters.city) params.city = filters.city;
      
      const response = await getTrainers(params);
      setTrainers(response.data || []);
    } catch (error) {
      console.error('Failed to load trainers', error);
    } finally {
      setLoading(false);
    }
  }, [filters]);

  useEffect(() => {
    loadTrainers();
  }, [loadTrainers]);

  return (
    <div className="min-h-screen bg-[#09090B] py-8 px-4 sm:px-6 lg:px-8" data-testid="trainer-search">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-white mb-2">Find Your Trainer</h1>
          <p className="text-zinc-400">Browse verified coaches in your area</p>
        </div>

        {/* Filters */}
        <div className="bg-[#18181B] border border-zinc-800 rounded-lg p-4 mb-8" data-testid="filters">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500" />
                <Input
                  placeholder="Search by city..."
                  value={filters.city}
                  onChange={(e) => setFilters({ ...filters, city: e.target.value })}
                  className="pl-10 bg-zinc-800/50 border-zinc-700 text-white"
                  data-testid="search-city"
                />
              </div>
            </div>
            
            <Select
              value={filters.category || "all"}
              onValueChange={(value) => setFilters({ ...filters, category: value === "all" ? "" : value })}
            >
              <SelectTrigger className="w-full sm:w-[200px] bg-zinc-800/50 border-zinc-700 text-white" data-testid="filter-category">
                <SelectValue placeholder="All Categories" />
              </SelectTrigger>
              <SelectContent className="bg-[#18181B] border-zinc-800">
                <SelectItem value="all">All Categories</SelectItem>
                {Object.entries(CATEGORY_NAMES).map(([key, name]) => (
                  <SelectItem key={key} value={key}>{name}</SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Button
              variant="outline"
              className="border-zinc-700 text-zinc-300 hover:bg-zinc-800"
              onClick={() => setFilters({ category: '', city: '' })}
              data-testid="clear-filters"
            >
              <Filter className="w-4 h-4 mr-2" />
              Clear
            </Button>
          </div>
        </div>

        {/* Results */}
        {loading ? (
          <div className="flex items-center justify-center py-20">
            <div className="spinner" />
          </div>
        ) : trainers.length === 0 ? (
          <div className="text-center py-20">
            <Users className="w-16 h-16 text-zinc-600 mx-auto mb-4" />
            <h2 className="text-xl font-bold text-white mb-2">No trainers found</h2>
            <p className="text-zinc-400 mb-4">Try adjusting your filters or search criteria</p>
            <Button 
              className="btn-primary"
              onClick={() => setFilters({ category: '', city: '' })}
            >
              Clear Filters
            </Button>
          </div>
        ) : (
          <>
            <p className="text-sm text-zinc-400 mb-6">{trainers.length} trainer{trainers.length !== 1 ? 's' : ''} found</p>
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6" data-testid="trainer-grid">
              {trainers.map((trainer) => (
                <TrainerCard key={trainer.id} trainer={trainer} />
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default TrainerSearch;
