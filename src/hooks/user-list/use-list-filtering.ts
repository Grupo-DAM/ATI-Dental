import { useState, useMemo, useEffect } from 'react';
import { ListConfig } from '@/constants/config';
import { USER_ROLES, LEGACY_ADMIN_ROLE } from '@/constants/user-roles';

const PAGE_CAPACITY = ListConfig.page.capacity;

/**
 * 1. Base Shared Filtering & Pagination Hook
 */
function useBaseFiltering<T>(
  data: T[],
  filterFn: (item: T, query: string) => boolean,
  sortFn: (a: T, b: T, orderBy: string) => number
) {
  const [currentPage, setCurrentPage] = useState<number>(0);
  const [searchQuery, setSearchQuery] = useState('');
  const [orderBy, setOrderBy] = useState('name');

  const filteredData = useMemo(() => {
    const query = searchQuery.toLowerCase().trim();
    return data
      .filter((item) => filterFn(item, query))
      .sort((a, b) => sortFn(a, b, orderBy));
  }, [data, searchQuery, orderBy, filterFn, sortFn]);

  // Adjust pagination when list size updates
  useEffect(() => {
    if (filteredData.length > 0 && currentPage === 0) {
      setCurrentPage(1);
    } else if (filteredData.length === 0) {
      setCurrentPage(0);
    }
  }, [filteredData, currentPage]);

  const startIndex = (currentPage - 1) * PAGE_CAPACITY;
  const endIndex = startIndex + PAGE_CAPACITY;
  const paginatedData = filteredData.slice(startIndex, endIndex);

  return {
    currentPage,
    setCurrentPage,
    searchQuery,
    setSearchQuery,
    orderBy,
    setOrderBy,
    filteredData,
    paginatedData,
    minRange: filteredData.length > 0 ? startIndex + 1 : 0,
    maxRange: Math.min(endIndex, filteredData.length),
    totalPages: Math.ceil(filteredData.length / PAGE_CAPACITY),
  };
}

/**
 * Shared Name & ID Comparators
 */
function sortByNameOrId(a: any, b: any, orderBy: string, nameKey: string, idKey: string) {
  if (orderBy === 'name' || orderBy === 'ID') {
    const keyA = orderBy === 'name' ? a[nameKey] : a[idKey];
    const keyB = orderBy === 'name' ? b[nameKey] : b[idKey];
    const strA = keyA?.toLowerCase() || '';
    const strB = keyB?.toLowerCase() || '';
    if (strA && !strB) return -1;
    if (!strA && strB) return 1;
    return strA.localeCompare(strB);
  }

  if (orderBy === 'lastname') {
    const lastNameA = a[nameKey]?.toLowerCase().split(' ').slice(1).join(' ') || '';
    const lastNameB = b[nameKey]?.toLowerCase().split(' ').slice(1).join(' ') || '';
    if (lastNameA && !lastNameB) return -1;
    if (!lastNameA && lastNameB) return 1;
    return lastNameA.localeCompare(lastNameB);
  }

  return 0;
}

/**
 * 2. Patient Filtering Hook
 */
export function usePatientFiltering(data: any[]) {
  const filterFn = useMemo(() => {
    return (item: any, query: string) => {
      if (!query) return true;
      const matchesName = item.fullName?.toLowerCase().includes(query);
      const matchesEmail = item.email?.toLowerCase().includes(query);
      const matchesID = item.patientCode?.toLowerCase().includes(query);
      return matchesName || matchesEmail || matchesID;
    };
  }, []);

  const sortFn = useMemo(() => {
    return (a: any, b: any, orderBy: string) => {
      const baseSort = sortByNameOrId(a, b, orderBy, 'fullName', 'patientCode');
      if (baseSort !== 0) return baseSort;

      if (orderBy === 'lastVisit' || orderBy === 'nextVisit') {
        const field = orderBy === 'lastVisit' ? 'ultima_visita' : 'proxima_visita';
        const dateA = a[field] ? new Date(a[field]).getTime() : 0;
        const dateB = b[field] ? new Date(b[field]).getTime() : 0;
        if (dateA > 0 && !dateB) return -1;
        if (!dateA && dateB > 0) return 1;
        return dateB - dateA;
      }

      return 0;
    };
  }, []);

  return useBaseFiltering(data, filterFn, sortFn);
}

/**
 * Helper predicates to reduce cognitive complexity
 */
function matchesUserSearch(item: any, query: string): boolean {
  if (!query) return true;
  const matchesName = item.nombre?.toLowerCase().includes(query);
  const matchesEmail = item.email?.toLowerCase().includes(query);
  const matchesID = (item.pid || item.id)?.toLowerCase().includes(query);
  return Boolean(matchesName || matchesEmail || matchesID);
}

function matchesUserRole(itemRole: string, selectedRoles: string[]): boolean {
  if (selectedRoles.length === 0) return true;
  return selectedRoles.some(role => {
    if (role === USER_ROLES.ADMIN) {
      return itemRole === USER_ROLES.ADMIN || itemRole === LEGACY_ADMIN_ROLE;
    }
    return itemRole === role;
  });
}

function matchesUserStatus(itemStatus: string, selectedStatus: string[]): boolean {
  if (selectedStatus.length === 0) return true;
  return selectedStatus.includes(itemStatus);
}

/**
 * 3. User Filtering Hook
 */
export function useUserFiltering(data: any[]) {
  const [selectedRoles, setSelectedRoles] = useState<string[]>([]);
  const [selectedStatus, setSelectedStatus] = useState<string[]>([]);

  const handleToggleFilter = (categoryTitle: string, optionName: string) => {
    if (categoryTitle === 'rol') {
      setSelectedRoles(prev => prev.includes(optionName) ? prev.filter(r => r !== optionName) : [...prev, optionName]);
    } else if (categoryTitle === 'estado') {
      setSelectedStatus(prev => prev.includes(optionName) ? prev.filter(s => s !== optionName) : [...prev, optionName]);
    }
  };

  const filterFn = useMemo(() => {
    return (item: any, query: string) => {
      return (
        matchesUserSearch(item, query) &&
        matchesUserRole(item.rol, selectedRoles) &&
        matchesUserStatus(item.estado, selectedStatus)
      );
    };
  }, [selectedRoles, selectedStatus]);

  const sortFn = useMemo(() => {
    return (a: any, b: any, orderBy: string) => {
      return sortByNameOrId(a, b, orderBy, 'nombre', 'pid');
    };
  }, []);

  const baseFiltering = useBaseFiltering(data, filterFn, sortFn);

  useEffect(() => {
    baseFiltering.setCurrentPage(1);
  }, [selectedRoles, selectedStatus]);

  return {
    ...baseFiltering,
    selectedRoles,
    selectedStatus,
    handleToggleFilter,
  };
}