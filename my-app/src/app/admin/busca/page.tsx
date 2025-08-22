import { SearchAdmin } from '@/components/admin/SearchAdmin';

export default function AdminSearchPage() {
  return (
    <div className="container mx-auto py-6">
      <SearchAdmin />
    </div>
  );
}

export const metadata = {
  title: 'Administração de Busca - Admin',
  description: 'Gerencie configurações e analise o desempenho do sistema de busca'
};