import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useMemo, useState } from 'react';

import { endpoints } from '../../../api/endpoints';
import { useToast } from '../../../hooks/useToast';
import type { AdminCustomer } from '../../../types/api';
import { getCustomerStatusMessage } from '../../../utils';
import { ErrorState, LoadingState } from '../../common/feedback/FeedbackStates';
import { AdminCustomerCard } from '../components/AdminCustomerCard';

type CustomerStatusTab = 'ALL' | 'ACTIVE' | 'DEACTIVATED';
type CustomerSort = 'name' | 'area' | 'pet-name' | 'pet-age';

const customerStatusTabs: { key: CustomerStatusTab; label: string }[] = [
  { key: 'ALL', label: 'All' },
  { key: 'ACTIVE', label: 'Active' },
  { key: 'DEACTIVATED', label: 'Deactivated' },
];

const collator = new Intl.Collator('en', { sensitivity: 'base', numeric: true });

function customerMatchesSearchQuery(customer: AdminCustomer, searchQuery: string) {
  const petText = customer.pets
    .flatMap((pet) => [pet.name, pet.species, pet.breed])
    .filter(Boolean)
    .join(' ');
  const searchableText = [customer.name, customer.email, customer.phone, customer.area, petText]
    .filter(Boolean)
    .join(' ')
    .toLowerCase();
  return searchQuery
    .toLowerCase()
    .split(/\s+/)
    .filter(Boolean)
    .every((term) => searchableText.includes(term));
}

function compareNullableText(left: string | null, right: string | null) {
  if (!left && !right) return 0;
  if (!left) return 1;
  if (!right) return -1;
  return collator.compare(left, right);
}

function youngestPetAge(customer: AdminCustomer) {
  const ages = customer.pets.map((pet) => pet.ageYears).filter((age): age is number => age != null);
  return ages.length ? Math.min(...ages) : null;
}

function petNameForSort(customer: AdminCustomer) {
  return customer.pets.map((pet) => pet.name).sort(collator.compare)[0] ?? null;
}

function compareCustomers(left: AdminCustomer, right: AdminCustomer, sort: CustomerSort) {
  if (sort === 'area') {
    const areaComparison = compareNullableText(left.area, right.area);
    if (areaComparison) return areaComparison;
  }
  if (sort === 'pet-name') {
    const petNameComparison = compareNullableText(petNameForSort(left), petNameForSort(right));
    if (petNameComparison) return petNameComparison;
  }
  if (sort === 'pet-age') {
    const leftAge = youngestPetAge(left);
    const rightAge = youngestPetAge(right);
    if (leftAge == null && rightAge != null) return 1;
    if (leftAge != null && rightAge == null) return -1;
    if (leftAge != null && rightAge != null && leftAge !== rightAge) {
      return leftAge - rightAge;
    }
  }
  return collator.compare(left.name, right.name) || collator.compare(left.email, right.email);
}

export function AdminCustomersPage() {
  const queryClient = useQueryClient();
  const toast = useToast();
  const [activeStatusTab, setActiveStatusTab] = useState<CustomerStatusTab>('ALL');
  const [searchQuery, setSearchQuery] = useState('');
  const [sort, setSort] = useState<CustomerSort>('name');
  const customerQuery = useQuery({
    queryKey: ['admin', 'customers'],
    queryFn: endpoints.admin.customers,
  });
  const customerStatusMutation = useMutation({
    mutationFn: ({ id, status }: { id: number; status: string }) =>
      endpoints.admin.updateCustomer(id, status),
    onSuccess: (_response, variables) => {
      void queryClient.invalidateQueries({ queryKey: ['admin', 'customers'] });
      void queryClient.invalidateQueries({ queryKey: ['admin', 'overview'] });
      void queryClient.invalidateQueries({ queryKey: ['admin', 'customer', variables.id] });
    },
  });
  const trimmedSearchQuery = searchQuery.trim();
  const searchFilteredCustomers = useMemo(() => {
    const customers = customerQuery.data ?? [];
    return trimmedSearchQuery
      ? customers.filter((customer) => customerMatchesSearchQuery(customer, trimmedSearchQuery))
      : customers;
  }, [customerQuery.data, trimmedSearchQuery]);
  const statusCounts = useMemo(
    () => ({
      ALL: searchFilteredCustomers.length,
      ACTIVE: searchFilteredCustomers.filter((customer) => customer.status === 'ACTIVE').length,
      DEACTIVATED: searchFilteredCustomers.filter((customer) => customer.status === 'DEACTIVATED')
        .length,
    }),
    [searchFilteredCustomers],
  );
  const visibleCustomers = useMemo(() => {
    const customers =
      activeStatusTab === 'ALL'
        ? searchFilteredCustomers
        : searchFilteredCustomers.filter((customer) => customer.status === activeStatusTab);
    return [...customers].sort((left, right) => compareCustomers(left, right, sort));
  }, [activeStatusTab, searchFilteredCustomers, sort]);

  if (customerQuery.isPending) return <LoadingState label="Loading customers…" />;
  if (customerQuery.isError)
    return (
      <ErrorState
        message={customerQuery.error.message}
        onRetry={() => void customerQuery.refetch()}
      />
    );

  function toggleCustomerStatus(customer: AdminCustomer) {
    const nextStatus = customer.status === 'DEACTIVATED' ? 'ACTIVE' : 'DEACTIVATED';
    customerStatusMutation.mutate(
      { id: customer.id, status: nextStatus },
      {
        onSuccess: () => {
          const statusMessage = getCustomerStatusMessage(nextStatus);
          toast.success(statusMessage.title, `${customer.name} ${statusMessage.message}`);
        },
        onError: (cause) => toast.error('Customer update failed', cause.message),
      },
    );
  }

  const emptyStateMessage = trimmedSearchQuery
    ? `No ${activeStatusTab === 'ALL' ? '' : `${activeStatusTab.toLowerCase()} `}customers match “${trimmedSearchQuery}”.`
    : activeStatusTab === 'ACTIVE'
      ? 'No active customers yet.'
      : activeStatusTab === 'DEACTIVATED'
        ? 'No deactivated customers.'
        : 'No customers have registered yet.';

  return (
    <>
      <p className="eyebrow">Customer directory</p>
      <h1>Customers</h1>
      <div className="admin-filter">
        <label>
          Search customers
          <input
            type="search"
            value={searchQuery}
            onChange={(event) => setSearchQuery(event.target.value)}
            placeholder="Name, email, phone, area, or pet"
          />
        </label>
        <label>
          Sort customers
          <select value={sort} onChange={(event) => setSort(event.target.value as CustomerSort)}>
            <option value="name">Name (A–Z)</option>
            <option value="area">Area (A–Z)</option>
            <option value="pet-name">Pet name (A–Z)</option>
            <option value="pet-age">Youngest pet first</option>
          </select>
        </label>
      </div>
      <div className="admin-tabs" role="tablist" aria-label="Customer status">
        {customerStatusTabs.map((statusTab) => (
          <button
            key={statusTab.key}
            type="button"
            role="tab"
            id={`customer-tab-${statusTab.key.toLowerCase()}`}
            aria-controls="customer-tab-panel"
            aria-selected={activeStatusTab === statusTab.key}
            className={activeStatusTab === statusTab.key ? 'active' : undefined}
            onClick={() => setActiveStatusTab(statusTab.key)}
          >
            {statusTab.label}
            <span className="admin-tab-count">{statusCounts[statusTab.key]}</span>
          </button>
        ))}
      </div>
      <div
        className="admin-tab-panel"
        id="customer-tab-panel"
        role="tabpanel"
        aria-labelledby={`customer-tab-${activeStatusTab.toLowerCase()}`}
      >
        {visibleCustomers.length === 0 ? (
          <p className="admin-tab-empty">{emptyStateMessage}</p>
        ) : (
          <div className="admin-review-list">
            {visibleCustomers.map((customer) => (
              <AdminCustomerCard
                key={customer.id}
                customer={customer}
                isStatusUpdatePending={customerStatusMutation.isPending}
                onToggleStatus={toggleCustomerStatus}
              />
            ))}
          </div>
        )}
      </div>
    </>
  );
}
