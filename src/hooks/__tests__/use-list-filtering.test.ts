import { renderHook, act } from '@testing-library/react-native';
import { usePatientFiltering, useUserFiltering } from '@/hooks/user-list/use-list-filtering';
import { USER_ROLES, LEGACY_ADMIN_ROLE } from '@/constants/user-roles';

// Mock de configuración de capacidad de página
jest.mock('@/constants/config', () => ({
  ListConfig: {
    page: {
      capacity: 2, // Se fija en 2 para probar la paginación fácilmente
    },
  },
}));

describe('Filtering & Pagination Hooks', () => {
  // --- Datos de prueba ---
  const mockPatients = [
    {
      id: 'p1',
      fullName: 'Ana Gómez',
      email: 'ana@test.com',
      patientCode: 'PAT-002',
      ultima_visita: '2023-01-10',
      proxima_visita: '2023-05-20',
    },
    {
      id: 'p2',
      fullName: 'Carlos Perez Silva',
      email: 'carlos@test.com',
      patientCode: 'PAT-001',
      ultima_visita: '2023-03-15',
      proxima_visita: '2023-02-10',
    },
    {
      id: 'p3',
      fullName: 'Beatriz Alvarez',
      email: 'beatriz@test.com',
      patientCode: 'PAT-003',
      ultima_visita: null,
      proxima_visita: null,
    },
  ];

  const mockUsers = [
    { pid: 'u1', nombre: 'Daniela Lopez', email: 'dani@test.com', rol: USER_ROLES.ADMIN, estado: 'activo' },
    { pid: 'u2', nombre: 'Eduardo Rodriguez', email: 'edu@test.com', rol: LEGACY_ADMIN_ROLE, estado: 'inactivo' },
    { pid: 'u3', nombre: 'Felipe Castro', email: 'feli@test.com', rol: USER_ROLES.ODONTOLOGO, estado: 'activo' },
    { pid: 'u4', id: 'u4', nombre: 'Gabriel Ruiz', email: 'gabi@test.com', rol: USER_ROLES.ASISTENTE, estado: 'pendiente' },
  ];

  describe('usePatientFiltering', () => {
    it('inicializa correctamente la paginación con datos', () => {
      const { result } = renderHook(() => usePatientFiltering(mockPatients));

      expect(result.current.currentPage).toBe(1);
      expect(result.current.totalPages).toBe(2); // 3 items con capacidad 2 = 2 páginas
      expect(result.current.minRange).toBe(1);
      expect(result.current.maxRange).toBe(2);
      expect(result.current.paginatedData).toHaveLength(2);
    });

    it('maneja un arreglo de datos vacío', () => {
      const { result } = renderHook(() => usePatientFiltering([]));

      expect(result.current.currentPage).toBe(0);
      expect(result.current.totalPages).toBe(0);
      expect(result.current.minRange).toBe(0);
      expect(result.current.maxRange).toBe(0);
      expect(result.current.paginatedData).toEqual([]);
    });

    it('filtra pacientes por nombre, email o código de paciente', () => {
      const { result } = renderHook(() => usePatientFiltering(mockPatients));

      act(() => {
        result.current.setSearchQuery('carlos');
      });

      expect(result.current.filteredData).toHaveLength(1);
      expect(result.current.filteredData[0].fullName).toBe('Carlos Perez Silva');

      act(() => {
        result.current.setSearchQuery('PAT-003');
      });

      expect(result.current.filteredData).toHaveLength(1);
      expect(result.current.filteredData[0].fullName).toBe('Beatriz Alvarez');
    });

    it('ordena por nombre (default) e ID', () => {
      const { result } = renderHook(() => usePatientFiltering(mockPatients));

      // Orden por nombre (Ana, Beatriz, Carlos)
      expect(result.current.filteredData[0].fullName).toBe('Ana Gómez');
      expect(result.current.filteredData[1].fullName).toBe('Beatriz Alvarez');

      // Orden por ID/Código (PAT-001, PAT-002, PAT-003)
      act(() => {
        result.current.setOrderBy('ID');
      });

      expect(result.current.filteredData[0].patientCode).toBe('PAT-001');
      expect(result.current.filteredData[1].patientCode).toBe('PAT-002');
    });

    it('ordena por apellido', () => {
      const { result } = renderHook(() => usePatientFiltering(mockPatients));

      act(() => {
        result.current.setOrderBy('lastname');
      });

      // Apellidos: Alvarez, Gómez, Perez Silva
      expect(result.current.filteredData[0].fullName).toBe('Beatriz Alvarez');
      expect(result.current.filteredData[1].fullName).toBe('Ana Gómez');
    });

    it('ordena por fecha de última visita y próxima visita', () => {
      const { result } = renderHook(() => usePatientFiltering(mockPatients));

      // Ordenar por última visita (más reciente primero)
      act(() => {
        result.current.setOrderBy('lastVisit');
      });
      expect(result.current.filteredData[0].fullName).toBe('Carlos Perez Silva'); // 2023-03-15

      // Ordenar por próxima visita (más reciente primero)
      act(() => {
        result.current.setOrderBy('nextVisit');
      });
      expect(result.current.filteredData[0].fullName).toBe('Ana Gómez'); // 2023-05-20
    });

    it('permite cambiar manualmente la página', () => {
      const { result } = renderHook(() => usePatientFiltering(mockPatients));

      act(() => {
        result.current.setCurrentPage(2);
      });

      expect(result.current.currentPage).toBe(2);
      expect(result.current.paginatedData).toHaveLength(1);
      expect(result.current.minRange).toBe(3);
      expect(result.current.maxRange).toBe(3);
    });
  });

  describe('useUserFiltering', () => {
    it('filtra usuarios por búsqueda global (nombre, email, pid o id)', () => {
      const { result } = renderHook(() => useUserFiltering(mockUsers));

      act(() => {
        result.current.setSearchQuery('u4');
      });

      expect(result.current.filteredData).toHaveLength(1);
      expect(result.current.filteredData[0].nombre).toBe('Gabriel Ruiz');
    });

    it('alterna y filtra por roles (incluyendo soporte de rol legacy admin)', () => {
      const { result } = renderHook(() => useUserFiltering(mockUsers));

      // Seleccionar rol Admin
      act(() => {
        result.current.handleToggleFilter('rol', USER_ROLES.ADMIN);
      });

      expect(result.current.selectedRoles).toContain(USER_ROLES.ADMIN);
      // Debe incluir Daniela (admin) y Eduardo (administrador - legacy)
      expect(result.current.filteredData).toHaveLength(2);

      // Alternar quita de rol
      act(() => {
        result.current.handleToggleFilter('rol', USER_ROLES.ADMIN);
      });

      expect(result.current.selectedRoles).not.toContain(USER_ROLES.ADMIN);
      expect(result.current.filteredData).toHaveLength(4);
    });

    it('alterna y filtra por estado del usuario', () => {
      const { result } = renderHook(() => useUserFiltering(mockUsers));

      act(() => {
        result.current.handleToggleFilter('estado', 'inactivo');
      });

      expect(result.current.selectedStatus).toContain('inactivo');
      expect(result.current.filteredData).toHaveLength(1);
      expect(result.current.filteredData[0].nombre).toBe('Eduardo Rodriguez');
    });

    it('reinicia a la página 1 al cambiar filtros de rol o estado', () => {
      const { result } = renderHook(() => useUserFiltering(mockUsers));

      // Mover a la página 2
      act(() => {
        result.current.setCurrentPage(2);
      });
      expect(result.current.currentPage).toBe(2);

      // Aplicar filtro de rol
      act(() => {
        result.current.handleToggleFilter('rol', USER_ROLES.ODONTOLOGO);
      });

      // Debe resetear a la primera página automáticamente
      expect(result.current.currentPage).toBe(1);
    });

    it('ignora filtros desconocidos en handleToggleFilter', () => {
      const { result } = renderHook(() => useUserFiltering(mockUsers));

      act(() => {
        result.current.handleToggleFilter('desconocido', 'opcion');
      });

      expect(result.current.selectedRoles).toHaveLength(0);
      expect(result.current.selectedStatus).toHaveLength(0);
    });
  });
});