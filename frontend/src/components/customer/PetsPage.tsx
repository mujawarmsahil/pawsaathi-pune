import { zodResolver } from '@hookform/resolvers/zod';
import { PawPrint, Trash2 } from 'lucide-react';
import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { z } from 'zod';

import { ApiError } from '../../api/errors';
import { usePetMutations, usePets } from '../../hooks/usePets';
import { EmptyState, ErrorState, LoadingState } from '../common/feedback/FeedbackStates';

export function PetsPage() {
  const petsQuery = usePets();
  const petMutations = usePetMutations();
  const [error, setError] = useState('');
  const [editingPetId, setEditingPetId] = useState<number | null>(null);
  const petSchema = z.object({
    name: z.string().trim().min(1).max(100),
    species: z.string().min(1).max(40),
    breed: z.string().max(80).optional(),
    ageYears: z.union([z.coerce.number().min(0).max(40), z.nan()]).optional(),
    notes: z.string().max(2000).optional(),
  });
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<z.input<typeof petSchema>, unknown, z.output<typeof petSchema>>({
    resolver: zodResolver(petSchema),
  });
  if (petsQuery.isPending) return <LoadingState label="Loading your pets…" />;
  if (petsQuery.isError)
    return (
      <ErrorState message={petsQuery.error.message} onRetry={() => void petsQuery.refetch()} />
    );

  async function savePet(petFormValues: z.infer<typeof petSchema>) {
    setError('');
    try {
      const petPayload = {
        ...petFormValues,
        ageYears: Number.isNaN(petFormValues.ageYears) ? null : petFormValues.ageYears,
      };
      if (editingPetId)
        await petMutations.update.mutateAsync({ id: editingPetId, body: petPayload });
      else await petMutations.create.mutateAsync(petPayload);
      setEditingPetId(null);
      reset();
    } catch (cause) {
      setError(cause instanceof ApiError ? cause.message : 'Could not save this pet.');
    }
  }

  return (
    <>
      <div className="dashboard-heading">
        <div>
          <p className="eyebrow">Your family</p>
          <h1>My pets</h1>
          <p>Keep care notes and details close at hand.</p>
        </div>
      </div>
      {error && (
        <div className="alert" role="alert">
          {error}
        </div>
      )}
      <div className="pet-grid">
        {petsQuery.data.map((pet) => (
          <article className="pet-card" key={pet.id}>
            <span className="pet-icon">
              <PawPrint />
            </span>
            <h3>{pet.name}</h3>
            <p>
              {pet.species}
              {pet.breed ? ` · ${pet.breed}` : ''}
            </p>
            {pet.ageYears !== undefined && <small>{pet.ageYears} years old</small>}
            <div className="pet-actions">
              <button
                className="text-link"
                onClick={() => {
                  setEditingPetId(pet.id);
                  reset({
                    name: pet.name,
                    species: pet.species,
                    breed: pet.breed,
                    ageYears: pet.ageYears,
                    notes: pet.notes,
                  });
                }}
              >
                Edit
              </button>
              <button
                className="remove-link"
                onClick={() => {
                  if (window.confirm(`Archive ${pet.name}?`))
                    petMutations.archive.mutate(pet.id, {
                      onError: (cause) => setError(cause.message),
                    });
                }}
              >
                <Trash2 size={13} /> Archive
              </button>
            </div>
          </article>
        ))}
      </div>
      {petsQuery.data.length === 0 && (
        <EmptyState
          title="No pets added yet"
          message="Add your pet’s details so care requests are tailored for them."
        />
      )}
      <form className="add-pet-card pet-form" onSubmit={handleSubmit(savePet)}>
        <h2>{editingPetId ? 'Edit pet' : 'Add a pet'}</h2>
        <label htmlFor="pet-name">Name</label>
        <input id="pet-name" {...register('name')} />
        {errors.name && <span className="form-error">{errors.name.message}</span>}
        <label htmlFor="pet-species">Species</label>
        <select id="pet-species" {...register('species')}>
          <option value="">Choose species</option>
          <option>Dog</option>
          <option>Cat</option>
          <option>Other</option>
        </select>
        <label htmlFor="pet-breed">Breed</label>
        <input id="pet-breed" {...register('breed')} />
        <label htmlFor="pet-age">Age in years</label>
        <input id="pet-age" type="number" min="0" max="40" step="0.5" {...register('ageYears')} />
        <label htmlFor="pet-notes">Care notes</label>
        <textarea id="pet-notes" rows={3} {...register('notes')} />
        <button
          className="button"
          disabled={petMutations.create.isPending || petMutations.update.isPending}
        >
          {editingPetId ? 'Save changes' : 'Save pet'}
        </button>
        {editingPetId && (
          <button
            type="button"
            className="button button-outline"
            onClick={() => {
              setEditingPetId(null);
              reset();
            }}
          >
            Cancel edit
          </button>
        )}
      </form>
    </>
  );
}
