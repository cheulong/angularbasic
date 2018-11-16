import { Component, OnInit, Input, ViewChild, Inject } from '@angular/core';
import { Dish } from '../shared/dish';
import { Comment } from '../shared/comment';
import { DishService } from '../services/dish.service';
import { Params, ActivatedRoute } from '@angular/router';
import { Location } from '@angular/common';
import { switchMap } from 'rxjs/operators';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import {coerceNumberProperty} from '@angular/cdk/coercion';
import { visibility, flyInOut, expand } from '../animations/app.animation';

@Component({
  selector: 'app-dishdetail',
  templateUrl: './dishdetail.component.html',
  styleUrls: ['./dishdetail.component.scss'],
  host: {
    '[@flyInOut]': 'true',
    'style': 'display: block;'
    },
  animations: [
    visibility(),
    flyInOut(),
    expand()
  ]
})


export class DishdetailComponent implements OnInit {
  @ViewChild('cform') commentFormDirective;
  commentForm: FormGroup;
  comment: Comment;

  @Input() dish: Dish;
  dishIds: string[];
  prev: string;
  next: string;

  visibility = 'shown';
  dishcopy: Dish;
  errMess: string;
  formErrors = {
    'comment': '',
    'author': ''
  };

  validationMessages = {
    'author': {
      'required':      'Name is required.',
      'minlength':     'Name must be at least 2 characters long.',
    },
    'comment': {
      'required':      'Comment is required.',
      'minlength':     'Comment must be at least 2 characters long.',
    }
  };

  constructor(private dishService: DishService,
    private route: ActivatedRoute,
    private location: Location,
    private fb: FormBuilder,
    @Inject('BaseURL') private BaseURL) {
      this.createForm();
     }

    ngOnInit() {
      this.dishService.getDishIds().subscribe(dishIds => this.dishIds = dishIds);

      this.route.params.pipe(switchMap((params: Params) => { this.visibility = 'hidden'; return this.dishService.getDish(+params['id']); }))
    .subscribe(dish => { this.dish = dish; this.dishcopy = dish; this.setPrevNext(""+dish.id); this.visibility = 'shown'; },
      errmess => this.errMess = <any>errmess);

    }
  
    setPrevNext(dishId: string) {
      const index = +dishId;
      
      this.prev = this.dishIds[(this.dishIds.length + index - 1) % this.dishIds.length];
      this.next = this.dishIds[(this.dishIds.length + index + 1) % this.dishIds.length];
      
    }

    createForm() {
      this.commentForm = this.fb.group({
        author: ['', [Validators.required, Validators.minLength(2)] ],
        comment: ['', [Validators.required, Validators.minLength(2)] ],
        rating: 5
      });
      this.commentForm.valueChanges
      .subscribe(data => this.onValueChanged(data));

    this.onValueChanged(); // (re)set validation messages now
    }

    get tickInterval(): number | 'auto' {
      return this._tickInterval;
    }
    set tickInterval(value) {
      this._tickInterval = coerceNumberProperty(value);
    }
    private _tickInterval = 1;

    goBack(): void {
      this.location.back();
    }

    onSubmit(){

      this.comment = this.commentForm.value;
      this.comment['date']=new Date().toISOString();
      this.dishcopy.comments.push(this.comment);
      this.dishService.putDish(this.dishcopy)
      .subscribe(dish => {
        this.dish = dish; this.dishcopy = dish;
      },
      errmess => { this.dish = null; this.dishcopy = null; this.errMess = <any>errmess; });
      this.commentFormDirective.resetForm();
      this.commentForm.reset({
        author: '',
        comment: '',
        rating: 5
      });
    }

    onValueChanged(data?: any) {
      if (!this.commentForm) { return; }
      const form = this.commentForm;
      for (const field in this.formErrors) {
        if (this.formErrors.hasOwnProperty(field)) {
          // clear previous error message (if any)
          this.formErrors[field] = '';
          const control = form.get(field);
          if (control && control.dirty && !control.valid) {
            const messages = this.validationMessages[field];
            for (const key in control.errors) {
              if (control.errors.hasOwnProperty(key)) {
                this.formErrors[field] += messages[key] + ' ';
              }
            }
          }
        }
      }
    }

}
