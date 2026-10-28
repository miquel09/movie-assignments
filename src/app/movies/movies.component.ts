import { Component, signal } from '@angular/core';
import { MovieDetailComponent } from './movie-detail/movie-detail.component';
import { MovieListComponent } from './movie-list/movie-list.component';
import { Movie } from './movie.interface';

@Component({
  imports: [MovieListComponent, MovieDetailComponent],
  selector: 'cw-movies',
  styleUrl: './movies.component.scss',
  templateUrl: './movies.component.html',
})
export class MoviesComponent {
    selectedMovie = signal<Movie | undefined>(undefined);
    movies = signal<Movie[]>([
      {id: 1, name: "de lift", genre: "horror", rating: 4.3},
      {id: 2, name: "Inception", genre: "science fiction", rating: 8.8},
      {id: 3, name: "The Godfather", genre: "crime", rating: 9.2},
      {id: 4, name: "Spirited Away", genre: "animation", rating: 8.6},
      {id: 5, name: "Get Out", genre: "horror", rating: 7.8},
      {id: 6, name: "The Grand Budapest Hotel", genre: "comedy", rating: 8.1},
      {id: 7, name: "Mad Max: Fury Road", genre: "action", rating: 8.1},
      {id: 8, name: "Arrival", genre: "science fiction", rating: 7.9},
      {id: 9, name: "Parasite", genre: "thriller", rating: 8.5},
      {id: 10, name: "The Shawshank Redemption", genre: "drama", rating: 9.3}
    ]);

    onMovieClicked(movie: Movie) {
      this.selectedMovie.set(movie);
    }
}
